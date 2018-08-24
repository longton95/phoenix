'use strict';

const
	os = require('os'),
	wd = require('wd'),
	chai = require('chai'),
	path = require('path'),
	fork = require('child_process').fork,
	Output = require('./Output_Helper.js'),
	exec = require('child_process').execSync,
	chaiAsPromised = require('chai-as-promised'),
	macServer = require.resolve('appium-mac-driver'),
	windowsServer = require.resolve('appium-windows-driver');

class Appium_Helper {
	/*****************************************************************************
	 * Uses the host operating system to generate a capability set. This will be
	 * used to start a session with the Appium server.
	 *
	 * @param {String} platform - The platform that is about to be launched
	 ****************************************************************************/
	static generateHostCapabilities() {
		switch (os.platform()) {
			case 'darwin':
				return {
					deviceName: 'Mac',
					platformName: 'Mac',
					app: 'AppceleratorStudio',
					platformVersion: getVersion()
				};

			case 'win32':
				return {
					deviceName: 'WindowsPC',
					platformName: 'Windows',
					app: path.join(os.homedir(), 'AppData', 'Roaming', 'Appcelerator', 'Appcelerator Studio', 'AppceleratorStudio.exe')
				};
		}
	}

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

			global.platform = cap.platformName; // FIXME: Replace this global, as it's overwritten by each new session

			// If running on a mobile platform, add an automation driver
			if (cap.platform === 'iOS') {
				cap.automationName = 'XCUITest';
			} else if (cap.platform === 'Android') {
				cap.automationName = 'Appium';
			}

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
	 * Returns an instance of a running Appium server
	 ****************************************************************************/
	static runAppium() {
		return new Promise((resolve, reject) => {
			// Retreive the server properties
			const server = global.server;

			Output.info(`Starting Appium Server On '${server.host}:${server.port}'... `);

			// We only want to allow starting a server on the local machine
			const validAddresses = [ 'localhost', '0.0.0.0', '127.0.0.1' ];

			if (validAddresses.includes(server.host)) {
				let
					driver,
					startServer;

				const
					args = [ '--port', server.port, '--address', server.host ],
					options = {
						silent: true
					};

				switch (os.platform()) {
					case 'darwin':
						driver = 'MacDriver';
						startServer = macServer;
						break;
					case 'win32':
						driver = 'WindowsDriver';
						startServer = windowsServer;
						break;
				}

				console.log(startServer);

				const appiumServer = fork(startServer, args, options);

				appiumServer.stdout.on('data', output => {
					const line = output.toString().trim();

					const
						regStr = `${driver} server listening on http://${server.host}:${server.port}`,
						isRunning = new RegExp(regStr, 'g').test(line);

					if (isRunning) {
						Output.finish(resolve, appiumServer);
					}
				});

				// For some reason the actual message we want is put through stdout, so we'll listen here as well for now
				// Don't know what to do if we get an actual error coming through, maybe it'll go to stdout...
				appiumServer.stderr.on('data', output => {
					const line = output.toString().trim();

					const
						regStr = `${driver} server listening on http://${server.host}:${server.port}`,
						isRunning = new RegExp(regStr, 'g').test(line);

					if (isRunning) {
						Output.finish(resolve, appiumServer);
					}
				});

				appiumServer.on('error', err => {
					reject(err.stack);
				});
			} else {
				reject('Connecting to an External Appium Server is Not Currently Supported');
			}
		});
	}

	/*****************************************************************************
	 * Tells the Appium server to shut down
	 *
	 * @param {String} appiumServer - The Appium server object
	 ****************************************************************************/
	static async quitServ(appiumServer) {
		Output.info('Stopping Appium Server... ');

		if (appiumServer) {
			await appiumServer.kill();
		}

		Output.finish();
	}
}

/*****************************************************************************
 * Gets the version of the host operating system, to pass on to Appium
 ****************************************************************************/
function getVersion() {
	let version;

	switch (os.platform()) {
		case 'darwin':
			version = exec('sw_vers');
			version = version.toString('utf8');
			version = version.match(/\d+\.\d+\.\d+/)[0];
			break;
		case 'win32':
		// TODO: Add in a method of finding Windows platform version
			version = '10'; // Just a guess for now
			break;
	}

	return version;
}

module.exports = Appium_Helper;
