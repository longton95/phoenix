'use strict';

const
	path = require('path'),
	program = require('commander'),
	Mocha = require('../Helpers/Mocha_Helper.js'),
	Output = require('../Helpers/Output_Helper.js'),
	Appium = require('../Helpers/Appium_Helper.js'),
	Device = require('../Helpers/Device_Helper.js'),
	// Zephyr = require('../Helpers/Zephyr_Helper.js'), // TODO: Add this functionality back in later
	WebDriver = require('../Helpers/WebDriver_Helper.js');

program
	.option('-p, --platforms <platform1,platform2>', 'List the platforms that you want to run the suite for. Defaults to \'iOS\' and \'Android\'.', 'iOS,Android')
	.option('-l, --logging <level>', 'Set the amount of Output returned by the process, options are \'debug\' and \'basic\'. Defaults to \'basic\'.', 'basic')
	.option('-A, --address <ip>', 'The IP address for where the Appium server is. Defaults to localhost', 'localhost')
	.option('-P, --port <port>', 'The port that the Appium server will run on. Defaults to 4723', 4723)
	.option('-u, --update', 'Publish the results to the Zephyr tests on JIRA.')
	.option('-f, --force', 'Force rebuild applications.')
	.parse(process.argv);

// If the user wants to push the results of the tests to Zephyr
global.update = program.update;
// A global placeholder for the current platform being tested
global.platform = undefined;
// Logging option for Output helper
global.logging = program.logging;
// The root of the project
global.projRoot = path.join(__dirname, '..');
// Get the Appium settings from the input flags
global.server = {
	host: program.address,
	port: program.port
};

// Setup the logging directory for this run
Output.setupLogDir(err => {
	if (err) {
		console.error(`An error occured setting up the logging directory!: ${err}`);
		process.exit();
	}
});

// TODO: Cater for new SIGINT requirements
// If the process is killed in the console, force close all test devices
process.on('SIGINT', () => {
	process.exit();
});

// Validate that the platforms passed are valid
let
	platforms = {},
	suppPlatforms = [ 'iOS', 'Android' ];

program.platforms.split(',').forEach(platform => {
	if (!suppPlatforms.includes(platform)) {
		Output.error(`'${platform}' is not a valid platform.`);
		process.exit();
	} else {
		platforms[platform] = {
			cycleId: undefined
		};
	}
});

let appiumServer; // A placeholder for storing the server object

// The promise chain for setting up suite services
Promise.resolve()
	// Log that the suite is starting up
	.then(() => Output.banner('Starting and Configuring Suite Services'))
	// Start an Appium server
	.then(() => Appium.runAppium())
	// Store the server object
	.then(server => appiumServer = server)
	// Load custom Mocha filters
	.then(() => WebDriver.addFilters())
	// Retreive the test cycle IDs
	// .then(() => Zephyr.getCycleIds(platforms, appcSDK)) // TODO: Add this functionality back in later
	// Handle errors
	.catch(err => {
		Output.error(err);
		// Shutdown the Appium server, as process.exit() will leave it running
		return Appium.quitServ(appiumServer)
			.then(() => process.exit());
	})
	// Output when beginning suite for a new application
	.then(() => Output.banner('Beginning suite for Appcelerator Studio'))
	// Launch the platform specific build and test
	.then(() => platformRun())
	.catch(err => Output.error(err))
	// Notify that the suite is finished
	.then(() => Output.banner('All Tests Run, Closing Down Services'))
	// Kill the Appium server
	.then(() => Appium.quitServ(appiumServer))
	.catch(err => Output.error(err));

/*******************************************************************************
 * The Appium run portion of the tests. This step goes through each required
 * platform, builds the app and launches it into its respective
 * emulator/simulator for the mocha test to run against. Then once the tests
 * have run tears itself down again.
 ******************************************************************************/
function platformRun() {
	return new Promise(resolve => {
		let p = Promise.resolve();

		suppPlatforms.forEach(platform => {
			if (!Object.keys(platforms).includes(platform)) {
				return;
			}

			let tests; // A holder for the test results

			p = p
				// Display information for the test that is about to be conducted
				.then(() => Output.banner(`Running For Platform '${platform}'`))
				// Generate a capability set based on the OS
				.then(() => Appium.generateHostCapabilities())
				// Start the client using the specified config
				.then(cap => Appium.startClient(cap))
				// Assign this driver to a global, as we will need it in every test
				.then(driver => global.studioDriver = driver)
				// Run the Mocha test suite with the specified test file
				.then(() => Mocha.mochaTest(platform))
				// Collect the test results
				.then(value => tests = value)
				// If fail is thrown then the next app starts to run, we don't want that if we're still waiting on more platforms
				.catch(error => Output.error(error))
				// Alert that the test stage has finished
				.then(() => Output.banner('Tests Run, Stopping Temporary Services'))
				// Stop the test client
				.then(() => Appium.stopClient(global.studioDriver))
				// If fail is thrown then the next app starts to run, we don't want that if we're still waiting on more platforms
				.catch(error => Output.error(error))
				// Close Studio
				.then(() => Device.processKill('AppceleratorStudio'))
				// Use the list of test states to update the test cycle
				// .then(() => Mocha.pushResults(tests, platforms[platform].cycleId, test, platform)) // TODO: Add this functionality back in later
				// If fail is thrown then the next app starts to run, we don't want that if we're still waiting on more platforms
				.catch(error => Output.error(error));
		});

		p.then(() => resolve());
	});
}
