'use strict';

const
	request = require('request'),
	Output = require('./Output_Helper.js'),
	exec = require('child_process').execSync,
	creds = require('../Config/Credentials.js').jira;

// Use the username and password to generate a base64 string, used to authenticate with JIRA
const
	comb = `${creds.username}:${creds.password}`,
	encodedComb = new Buffer(comb).toString('base64');

class Zephyr_Helper {
	/*****************************************************************************
	 * Use the JIRA and Zephyr APIs to update a given ticket with a test result.
	 *
	 * @param {String} status - The new status for the test execution
	 * @param {String} comment - A comment to attatch to the ticket
	 * @param {String} cycleId - The Zephyr ID for the test cycle
	 ****************************************************************************/
	static updateExecution(status, comment, cycleId) {
		return new Promise((resolve, reject) => {
			Output.info(`Updating Zephyr Test For '${global.hostOS}-${global.platformOS}'... `);

			if (!global.update) {
				Output.skip(resolve, []);
			} else {
				let
					execId,
					issueId,
					zephyrTic;

				Promise.resolve()
					// Use the test ticket name to find the Zephyr ticket ID
					.then(() => getZephyr())
					// Assign the found value to the zephyrTic
					.then(value => zephyrTic = value)
					// Get the JIRA ID for the Zephyr ticket that needs updating
					.then(() => getZephyrId(zephyrTic))
					// Assign the found value to the issueId
					.then(value => issueId = value)
					// Use the Zephyr ticket ID and the test cycle ID to get the Zephyr ID of the test execution that needs to be updated
					.then(() => getExecution(issueId, cycleId, zephyrTic))
					// Assign the found value to the execId
					.then(value => execId = value)
					// Use the execution ID to update the ticket to being unexecuted
					.then(() => resetTicket(execId))
					// Use the execution ID to update the ticket with the relevant test update information
					.then(() => updateTicket(execId, status, comment))
					// Retrieve the step IDs for the execution
					.then(() => getStepIds(execId))
					// Resolve the chain
					.then(stepIds => Output.finish(resolve, stepIds))
					// Check the issue, if it's a string then it's a message to be displayed
					.catch(err => {
						if (typeof(err) === 'string') {
							Output.error(err);
							resolve([]);
						} else {
							reject(err);
						}
					});
			}
		});
	}

	/*****************************************************************************
	 * Use the JIRA and Zephyr APIs to update a given ticket with a test result.
	 *
	 * @param {Array[Object]} step - Array containing details of the test steps
	 * @param {Number} testNum - The order number of the test
	 * @param {String} status - The test status to push to JIRA
	 * @param {Array[String]} comment - The error output from the test
	 ****************************************************************************/
	static updateStep(step, testNum, status, comment) {
		return new Promise((resolve, reject) => {
			let
				stepId,
				created = true;

			if (step[testNum - 1]) {
				stepId = step[testNum - 1].id;
			} else {
				stepId = testNum;
				created = false;
			}

			Output.info(`Update Test Step ${stepId}... `);

			if (!global.update || !created) {
				Output.skip(resolve, null);
			} else {
				Promise.resolve()
					// Push the update to the test step
					.then(() => updateTestStep(stepId, status, comment))
					// Resolve the chain
					.then(() => Output.finish(resolve, null))
					// Check the issue, if it's a string then it's a message to be displayed
					.catch(err => {
						if (typeof(err) === 'string') {
							Output.error(err);
							resolve();
						} else {
							reject(err);
						}
					});
			}
		});
	}

	/*****************************************************************************
	 * Use the JIRA and Zephyr APIs to retrieve the Cycle ID for the current test
	 * run. Only needs to be done once so is seperated from the rest of the API
	 * calls
	 *
	 * @param {String} appcSDK - The SDK version desired for testing
	 * @param {String} appcCLI - The CLI version desired for testing
	 ****************************************************************************/
	static getCycleId(appcSDK, appcCLI) {
		return new Promise((resolve, reject) => {
			Output.info('Retreiving Zephyr Test Cycle ID... ');

			if (!global.update) {
				Output.skip(resolve, null);
			} else {
				if (appcCLI === 'latest') {
					appcCLI = JSON.parse(exec('appc info -o json')).appcCLI.corepackage.version;
				}

				const
					sdkVersion = appcSDK.split('.').slice(0, 3).join('.'),
					cliVersion = appcCLI.split('.').slice(0, 3).join('.'),
					release = `Release ${sdkVersion}`,
					cycleName = `Appium SDK ${sdkVersion} GA & ${cliVersion} Core Release Smoke Tests`;

				let
					cycleId,
					releaseId,
					projectId,
					projectKey = 'TIMOB'; // I'm assuming we're not testing any other projects

				Promise.resolve()
					// Get the JIRA ID value for the project that the test belongs to
					.then(() => getProject(projectKey))
					// Assign the found value to the projectId
					.then(value => projectId = value)
					// Get the JIRA ID for the release version that is being tested for
					.then(() => getRelease(projectId, release))
					// Assign the found value to the releaseId
					.then(value => releaseId = value)
					// Use the project ID and the release version ID to find the Zephyr ID for the test cycle
					.then(() => getCycle(projectId, releaseId, cycleName))
					// Assign the ID
					.then(value => cycleId = value)
					// Finish
					.then(() => Output.finish(resolve, cycleId))
					// Handle Errors
					.catch(err => reject(err));
			}
		});
	}
}

module.exports = Zephyr_Helper;

/*******************************************************************************
 * Use the issue ticket number to get the Zephyr test ticket for the issue
 ******************************************************************************/
function getZephyr() {
	return new Promise((resolve, reject) => {
		let extraArgs = '';

		if (global.platformOS === 'Windows') {
			extraArgs = ' - Android';
		}
		const data = {
			url: 'https://jira.appcelerator.org/rest/api/latest/search',
			body: `{"jql":"project = TIMOB AND issuetype = Test AND text ~ 'Acceptance: Platform: ${global.hostOS} ${global.platformOS}${extraArgs}'"}`,
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Basic ${encodedComb}`
			}
		};

		makeRequest(data)
			.then(response => {
				try {
					resolve(response.issues[0].key);
				} catch (err) {
					reject('Can\'t Find Matching Zephyr Ticket For Issue');
				}
			})
			.catch(err => reject(err));
	});
}

/*******************************************************************************
 * Use the Zephyr ticket number to get its ID value
 *
 * @param {String} zephyrTic - The ticket number of the Zephyr test
 ******************************************************************************/
function getZephyrId(zephyrTic) {
	return new Promise((resolve, reject) => {
		const data = {
			url: `https://jira.appcelerator.org/rest/api/latest/issue/${zephyrTic}`,
			body: '{}',
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Basic ${encodedComb}`
			}
		};

		makeRequest(data)
			.then(response => {
				try {
					resolve(response.id);
				} catch (err) {
					reject(`Couldn't Find Issue ${zephyrTic}`);
				}
			})
			.catch(err => reject(err));
	});
}

/*******************************************************************************
 * Get the ID value for the test execution, by using the ID from the issue, the
 * ID from the cycle, and the Zephyr ticket number
 *
 * @param {String} issueId - The ID of the issue
 * @param {String} cycleId - The ID of the cycle
 * @param {String} zephyrTic - The ticket number of the Zephyr test
 ******************************************************************************/
function getExecution(issueId, cycleId, zephyrTic) {
	return new Promise((resolve, reject) => {
		const data = {
			url: `https://jira.appcelerator.org/rest/zapi/latest/execution?issueId=${issueId}&cycleId=${cycleId}`,
			body: '{}',
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Basic ${encodedComb}`
			}
		};

		makeRequest(data)
			.then(response => {
				try {
					resolve(response.executions[0].id);
				} catch (err) {
					reject(`Could Not Find Any Executions in the Ticket ${zephyrTic} for the requested test cycle`);
				}
			})
			.catch(err => reject(err));
	});
}

/*******************************************************************************
 * Change the status of the test execution to unexecuted, so that the execution
 * date will be updated for the ticket. Otherwise if the status stays the same,
 * the execution date will not be updated
 *
 * @param {String} execId - The execution ID of the Zephyr test
 ******************************************************************************/
function resetTicket(execId) {
	return new Promise((resolve, reject) => {
		const data = {
			url: `https://jira.appcelerator.org/rest/zapi/latest/execution/${execId}/execute`,
			body: '{"status":"-1", "comment":"Resetting Ticket..."}',
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Basic ${encodedComb}`
			}
		};

		makeRequest(data)
			.then(() => resolve())
			.catch(err => reject(err));
	});
}

/*******************************************************************************
 * Change the status of the test execution, and leave a comment on the ticket
 * describing any current issues with the test
 *
 * @param {String} execId - The execution ID of the Zephyr test
 * @param {String} status - Numerical value representing the status of the test
 * @param {String} comment - A comment to attatch to the ticket
 ******************************************************************************/
function updateTicket(execId, status, comment) {
	return new Promise((resolve, reject) => {
		const data = {
			url: `https://jira.appcelerator.org/rest/zapi/latest/execution/${execId}/execute`,
			body: `{"status":"${status}", "comment":"${comment}"}`,
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Basic ${encodedComb}`
			}
		};

		makeRequest(data)
			.then(() => resolve())
			.catch(err => reject(err));
	});
}

/*******************************************************************************
 * Gets a list of all the step results linked with this execution ID, so they
 * can be updated individually later on
 *
 * @param {String} execId - The execution ID of the Zephyr test
 ******************************************************************************/
function getStepIds(execId) {
	return new Promise((resolve, reject) => {
		const data = {
			url: `https://jira.appcelerator.org/rest/zapi/latest/stepResult?executionId=${execId}`,
			body: '{}',
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Basic ${encodedComb}`
			}
		};

		makeRequest(data)
			.then(response => {
				try {
					resolve(response);
				} catch (err) {
					reject(`Could Not Find Any Test Steps in the Execution ${execId} for the requested test cycle`);
				}
			})
			.catch(err => reject(err));
	});
}

/*******************************************************************************
 * Push an update to the test step, reflecting the test status, and display a
 * comment regarding the results
 *
 * @param {String} stepId - The step ID of the Zephyr test step
 * @param {String} status - Numerical value representing the status of the test
 * @param {Array[String]} comment - Array containing the comments for the test
 ******************************************************************************/
function updateTestStep(stepId, status, comment) {
	return new Promise((resolve, reject) => {
		const data = {
			url: `https://jira.appcelerator.org/rest/zapi/latest/stepResult/${stepId}`,
			body: `{"status":"${status}", "comment":"${comment.length} Test Step(s) Failing\\n\\n${comment.join('\\n\\n')}"}`,
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Basic ${encodedComb}`
			}
		};

		makeRequest(data)
			.then(() => resolve())
			.catch(err => reject(err));
	});
}

/*******************************************************************************
 * Use the project key to find the ID value for the project
 *
 * @param {String} projectKey - The name of the project
 ******************************************************************************/
function getProject(projectKey) {
	return new Promise((resolve, reject) => {
		const data = {
			url: `https://jira.appcelerator.org/rest/api/latest/project/${projectKey}`,
			body: '{}',
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Basic ${encodedComb}`
			}
		};

		makeRequest(data)
			.then(response => {
				try {
					resolve(response.id);
				} catch (err) {
					reject(new Error(`Cannot Find a Project Matching "${projectKey}"`));
				}
			})
			.catch(err => reject(err));
	});
}

/*******************************************************************************
 * Use the ID of the project, and the release version number to finr the ID
 * value of the release
 *
 * @param {String} projectId - The ID for the project
 * @param {String} release - The version number for the release
 ******************************************************************************/
function getRelease(projectId, release) {
	return new Promise((resolve, reject) => {
		const data = {
			url: `https://jira.appcelerator.org/rest/api/latest/project/${projectId}/versions`,
			body: '{}',
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Basic ${encodedComb}`
			}
		};

		makeRequest(data)
			.then(response => {
				for (let i = 0; i < response.length; i++) {
					if (response[i].name === release) {
						resolve(response[i].id);
					}
					if (i === (response.length - 1)) {
						reject(new Error(`Cannot find a release matching ${release}`));
					}
				}
			})
			.catch(err => reject(err));
	});
}

/*******************************************************************************
 * Use the IDs of the project and release, as well as the cycle name to find
 * the ID value of the cycle, that can then be used to update the test
 * executions
 *
 * @param {String} projectId - The ID for the project
 * @param {String} releaseId - The ID for the release
 * @param {String} cycleName - The name of the Zephyr test cycle
 ******************************************************************************/
function getCycle(projectId, releaseId, cycleName) {
	return new Promise((resolve, reject) => {
		const data = {
			url: `https://jira.appcelerator.org/rest/zapi/latest/cycle?projectId=${projectId}&versionId=${releaseId}`,
			body: '{}',
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Basic ${encodedComb}`
			}
		};

		makeRequest(data)
			.then(response => {
				Object.keys(response).forEach(key => {
					let name = (response[key].name);
					// Resolve if we've found the key we're looking for
					if (name === cycleName) {
						resolve(key);
					}

					// We've reached the end of the list, reject with error
					if (key === 'recordsCount') {
						reject(new Error(`Didn't Find a Test Cycle Matching "${cycleName}"`));
					}
				});
			})
			.catch(err => reject(err));
	});
}

/*******************************************************************************
 * Make a HTTP request with the given resources.
 *
 * @param {Object} data - The particulars for the request
 ******************************************************************************/
function makeRequest(data) {
	return new Promise((resolve, reject) => {
		request(data, (err, response, body) => {
			if (err) {
				reject(err);
			} else {
				try {
					resolve(JSON.parse(body));
				} catch (catchErr) {
					Output.debug(body, 'debug');
					Output.debug(catchErr, 'debug');
					reject(new Error('Issue in JSON Parsing, Dumping Request Body to Log'));
				}
			}
		});
	});
}
