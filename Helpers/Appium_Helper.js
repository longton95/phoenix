'use strict';

const
	os = require('os'),
	wd = require('wd'),
	chai = require('chai'),
	path = require('path'),
	spawn = require('child_process').spawn,
	Output = require('./Output_Helper.js'),
	exec = require('child_process').execSync,
	chaiAsPromised = require('chai-as-promised');

class Appium_Helper {

	/*****************************************************************************
	 * Starts a WD session on the device, using the given capability requirements
	 * as Appium configuration
	 *
	 * @param {String} platform - The platform that is about to be launched
	 ****************************************************************************/
	static startClient(cap) {
		return new Promise((resolve, reject) => {
			Output.info('Starting WebDriver Instance... ');
			// enabling chai assertion style: https://www.npmjs.com/package/chai-as-promised#node
			chai.use(chaiAsPromised);
			chai.should();
			// enables chai assertion chaining
			chaiAsPromised.transferPromiseness = wd.transferPromiseness;

			let driver = wd.promiseChainRemote(global.server);

			global.platform = cap.platformName; // TODO: Replace this global, as it's overwritten by each new session

			cap.newCommandTimeout = (60 * 10); // Sets the amount of time Appium waits before shutting down in the background

			driver.init(cap, err => {
				(err) ? reject(err) : Output.finish(resolve, driver);
			});
		});
	}

	/*****************************************************************************
	 * Stops the WD session, but first it closes and removes the app from the
	 * device, to attempt to save storage space
	 ****************************************************************************/
	static stopClient(driver) {
		return new Promise((resolve, reject) => {
			Output.info('Stopping WebDriver Instance... ');

			Promise.resolve()
				.then(() => driver.quit())
				.catch(err => reject(err))
				.then(() => Output.finish(resolve, null));
		});
	}

	/*****************************************************************************
	 * Starts a local Appium server running as a child process
	 ****************************************************************************/
	static runAppium() {
		return new Promise((resolve, reject) => {
			const server = global.server;

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
	static quitServ(appiumPid) {
		return new Promise(resolve => {
			Output.info('Stopping Appium Server... ');

			if (!appiumPid) {
				Output.skip(resolve);
			}

			exec(`kill -9 ${appiumPid}`);

			Output.finish(resolve);
		});
	}

	static getVersion() {
		let
			version,
			platform = os.platform();

		if (platform === 'darwin') {
			version = exec('sw_vers');
			version = version.toString('utf8');
			version = version.match(/\d+\.\d+\.\d+/)[0];
		} else if (platform === 'windows') {
			// TODO: Add in a method of finding Windows platform version
			version = '10'; // Just a guess for now
		}

		return version;
	}
}

module.exports = Appium_Helper;
