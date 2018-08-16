'use strict';

const
	path = require('path'),
	spawn = require('child_process').spawn,
	Output = require('./Output_Helper.js'),
	exec = require('child_process').execSync;

class Appium_Helper {
	/*****************************************************************************
	 * Creates the Appium object, and initialises the webdriver requirements
	 * needed for the running of the tests.
	 *
	 * @param {Object} config - The properties of the Appium server
	 ****************************************************************************/
	constructor(config) {
		this.wd = require('wd');
		this.chai = require('chai');
		this.chaiAsPromised = require('chai-as-promised');

		// enabling chai assertion style: https://www.npmjs.com/package/chai-as-promised#node
		this.chai.use(this.chaiAsPromised);
		this.chai.should();
		// enables chai assertion chaining
		this.chaiAsPromised.transferPromiseness = this.wd.transferPromiseness;

		this.driver = this.wd.promiseChainRemote(config);

		// These will be accessed in the Appium mocha tests
		global.driver = this.driver;
		global.webdriver = this.wd;
	}

	/*****************************************************************************
	 * Starts a WD session on the device, using the given capability requirements
	 * as Appium configuration
	 *
	 * @param {String} platform - The platform that is about to be launched
	 ****************************************************************************/
	startClient(platform) {
		return new Promise((resolve, reject) => {
			Output.info('Starting WebDriver Instance... ');

			global.platform = platform;

			let version;

			if (platform === 'Mac') {
				version = exec('sw_vers');
				version = version.toString('utf8');
				version = version.match(/\d+\.\d+\.\d+/)[0];
			} else if (platform === 'Windows') {
				// TODO: Add in a method of finding Windows platform version
				version = '10'; // Just a guess for now
			}

			const cap = {
				app: 'AppceleratorStudio',
				deviceName: platform,
				platformName: platform,
				platformVersion: version,
				newCommandTimeout: (60 * 10) // Sets the amount of time Appium waits before shutting down in the background
			};

			this.driver.init(cap, err => {
				(err) ? reject(err) : Output.finish(resolve, null);
			});
		});
	}

	/*****************************************************************************
	 * Stops the WD session, but first it closes and removes the app from the
	 * device, to attempt to save storage space
	 ****************************************************************************/
	stopClient() {
		return new Promise((resolve, reject) => {
			Output.info('Stopping WebDriver Instance... ');

			const driver = this.driver;

			Promise.resolve()
				.then(() => exec('killall -9 AppceleratorStudio'))
				// .then(() => driver.closeApp())// .catch(err => Output.error(err))
				.then(() => driver.quit())
				.catch(err => reject(err))
				.then(() => Output.finish(resolve, null));
		});
	}

	/*****************************************************************************
	 * Starts a local Appium server running as a child process
	 *
	 * @param {Object} server - the server property from server_config.js
	 ****************************************************************************/
	runAppium(server) {
		return new Promise((resolve, reject) => {
			Output.info(`Starting Appium Server On '${server.host}:${server.port}'... `);
			// We only want to allow starting a server on the local machine
			const validAddresses = [ 'localhost', '0.0.0.0', '127.0.0.1' ];

			if (validAddresses.includes(server.host)) {
				let
					appiumExe = path.join(__dirname, '..', 'node_modules', '.bin', 'appium'),
					flags = [ '--log-no-colors', '-a', server.host, '-p', server.port, '--show-ios-log' ];

				const prc = spawn(appiumExe, flags);

				prc.stdout.on('data', output => {
					const line = output.toString().trim();

					const
						regStr = `started on ${server.host}\\:${server.port}$`,
						isRunning = new RegExp(regStr, 'g').test(line);
					if (isRunning) {
						Output.finish(resolve, prc.pid);
					}
				});

				prc.stderr.on('data', output => {
					reject(output.toString());
				});

				prc.on('error', err => {
					reject(err.stack);
				});
			} else {
				reject('Connecting to an External Appium Server is Not Currently Supported');
			}
		});
	}

	/*****************************************************************************
	 * Finds the launched Appium process, and kills it
	 *
	 * @param {String} appiumPid - The process ID of the Appium server
	 ****************************************************************************/
	quitServ(appiumPid) {
		return new Promise(resolve => {
			Output.info('Stopping Appium Server... ');

			if (!appiumPid) {
				Output.skip(resolve);
			}

			exec(`kill -9 ${appiumPid}`);

			Output.finish(resolve);
		});
	}
}

module.exports = Appium_Helper;
