'use strict';

const
	path = require('path'),
	fs = require('fs-extra'),
	Mocha = require('mocha'),
	Zephyr = require('./Zephyr_Helper.js'),
	Output = require('./Output_Helper.js');

class Mocha_Helper {
	/*****************************************************************************
	 * Runs through the Mocha tests outlined in device_config.js
	 *
	 * @param {String} platform - The OS being run on
	 ****************************************************************************/
	static mochaTest(platform) {
		return new Promise((resolve, reject) => {

			Output.info('Starting Tests\n');

			// Have to clear cache so that Mocha will run the same tests twice, solution taken from here https://github.com/mochajs/mocha/issues/995#issuecomment-261752316
			Object.keys(require.cache).forEach(function (file) {
				delete require.cache[file];
			});

			// Create the new Mocha instance
			let mocha = new Mocha({
				fullTrace: false,
				useColors: true,
				timeout: 60000,
				slow: 40000,
				reporter: 'mocha-jenkins-reporter',
				reporterOptions: {
					junit_report_name: `${platform}: Appcelerator Studio`,
					junit_report_path: path.join(global.projRoot, 'Reports', `${platform}_Appcelerator_Studio.xml`),
					junit_report_stack: 1
				}
			});

			let tests = [];

			getTests()
				.then(files => {
					// Break here if no tests are defined
					if (files.length === 0) {
						resolve(tests);
					}

					// Add all of the test files one by one
					files.forEach(file => {
						mocha.addFile(file);
					});

					global.testing = true;

					mocha.run()
						.on('test end', data => {
							try {
								// Attempt to pull the name of the ticket using the file path of the test
								let
									test,
									ticket = data.title;

								if (data.title === 'Not For Platform') {
									// If the test is marked as 'Not For Platform'
									Output.log(`${ticket}: ${data.title} - Not For Platform`);
									// There shouldn't be a case of this already in the array, but just in case
									if (tests.includes(tests.find(x => x.name === ticket))) {
										// Find the index of the ticket in the array
										let index = tests.indexOf(tests.find(x => x.name === ticket));
										// Add the skip message onto the object
										tests[index].errors.push(data.title);
									} else {
										// Create the object
										test = {
											name: ticket,
											state: data.title,
											errors: []
										};
									}
								} else if (data.pending === true) {
									// If the test is to was skipped
									Output.log(`${ticket}: ${data.title} - Skipped`);
									// Check if the ticket is already in the array
									if (tests.includes(tests.find(x => x.name === ticket))) {
										// Find the index of the ticket in the array
										let index = tests.indexOf(tests.find(x => x.name === ticket));
										// Add the skip message onto the object
										tests[index].errors.push(data.title.replace(/\\/g, '').replace(/"/g, '\''));
									} else {
										// If a ticket object isn't already in the array, create it
										test = {
											name: ticket,
											state: 'Skip',
											errors: [ data.title.replace(/\\/g, '').replace(/"/g, '\'') ]
										};
									}
								} else if (data.state === 'passed') {
									// Action for if the test passed
									Output.log(`${ticket}: ${data.title} - Passed`);
									// Check if the ticket is already in the array
									if (tests.includes(tests.find(x => x.name === ticket))) {
										// Find the index of the ticket in the array
										let index = tests.indexOf(tests.find(x => x.name === ticket));
										// Change the state of the test to a pass if it was previously skipped
										if (tests[index].state === 'Skip') {
											tests[index].state = 'Pass';
										}
									} else {
										// Create a new ticket object if one doesn't exist
										test = {
											name: ticket,
											state: 'Pass',
											errors: []
										};
									}
								} else if (data.state === 'failed') {
									// Action for if the test failed
									Output.log(`${ticket}: ${data.title} - Failed`);
									Output.log(`Reason: ${data.err.message}`);
									// Create a message to be attatched to the ticket
									let failMessage = `[TEST STEP] ${data.title.replace(/"/g, '\'')}\\n[RESULT] ${data.err.message.replace(/\\/g, '').replace(/"/g, '\'')}`;
									// Check if the ticket is already in the array
									if (tests.includes(tests.find(x => x.name === ticket))) {
										// Find the index of the ticket in the array
										let index = tests.indexOf(tests.find(x => x.name === ticket));
										// Change the state of the test to a failure
										tests[index].state = 'Fail';
										// Add the error into the array
										tests[index].errors.push(failMessage);
									} else {
										// Create a new ticket object if one doesn't exist
										test = {
											name: ticket,
											state: 'Fail',
											errors: [ failMessage ]
										};
									}
								}

								if (test) {
									tests.push(test);
								}

							} catch (err) {
								delete global.testing;
								Output.error(err);
							}
						})
						.on('end', () => {
							delete global.testing;
							resolve(tests);
						});
				})
				.catch(err => {
					delete global.testing;
					reject(err);
				});
		});
	}

	/*******************************************************************************
	 * Hand off the desired test status to the Zephyr helper, which willuse the API
	 * tools to update the status on JIRA
	 *
	 * @param {Array[Object]} tests - An array of objects containing the run results
	 * @param {String} cycleId - The Zephyr ID for the test cycle
	 * @param {String} moduleName - The module being tested
	 * @param {String} platform - The OS being run on
	 ******************************************************************************/
	static pushResults(tests, cycleId, moduleName, platform) {
		return new Promise((resolve, reject) => {
			Output.banner('Publishing Zephyr results to JIRA');

			let p = Promise.resolve();

			tests.forEach(test => {
				p = p
					.then(() => {
						if (test.state === 'Pass') {
							// Push the result to JIRA as a pass (1)
							return Zephyr.update(test.name, moduleName, '1', test.errors, cycleId, platform);
						} else if (test.state === 'Fail') {
							// Push the result to JIRA as a fail (2)
							return Zephyr.update(test.name, moduleName, '2', test.errors, cycleId, platform);
						} else if (test.state === 'Skip') {
							// Push the result to JIRA as a work in progress (3)
							return Zephyr.update(test.name, moduleName, '3', test.errors, cycleId, platform);
						} else if (test.state === 'Not For Platform') {
							// Push the result to JIRA as a not for platform (5)
							return Zephyr.update(test.name, moduleName, '5', test.errors, cycleId, platform);
						}
					})
					.catch((err) => reject(err));
			});

			p.then(() => resolve());
		});
	}
}

/*******************************************************************************
 * Collect all test files for the desired platform and test application
 ******************************************************************************/
function getTests() {
	return new Promise((resolve, reject) => {
		// Our container for all the test files to be run
		let
			dir,
			tests = [];

		// Create a file path
		dir = path.join(global.projRoot, 'Tests');

		try {
			// Iterate through each file within the test directory
			fs.readdirSync(dir).forEach(file => {
				// Only use actual test files, ignore everything else
				if (file.match(/.+\.test\.js/g)) {
					let filePath = path.join(dir, file);

					tests.push(filePath);
				}
			});
		} catch (err) {
			reject(err);
		}

		resolve(tests);
	});
}

module.exports = Mocha_Helper;
