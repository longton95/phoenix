'use strict';

const
	os = require('os'),
	wd = require('wd'),
	chai = require('chai'),
	path = require('path'),
	Appc = require('./Appc_Helper.js'),
	spawn = require('child_process').spawn,
	Device = require('./Device_Helper.js'),
	Output = require('./Output_Helper.js'),
	chaiAsPromised = require('chai-as-promised');

class Appium_Helper {
	/*****************************************************************************
	 * Starts a WD session on the device, using the given capability requirements
	 * as Appium configuration
	 *
	 * @param {String} platform - The platform that is about to be launched
	 ****************************************************************************/
	static startClient(platform) {
		return new Promise(async (resolve, reject) => {
			Output.info('Starting WebDriver Instance... ');

			let capabilities;

			switch (platform) {
				case 'android':
					capabilities = require('../Config/Test_Config.js').android;
					break;

				case 'genymotion':
					capabilities = require('../Config/Test_Config.js').genymotion;
					break;

				default:
					capabilities = require('../Config/Test_Config.js').ios;
					break;
			}

			let cap = {
				app: Appc.genAppPath(),
				platformName: capabilities.platform,
				platformVersion: capabilities.platVersion,
				deviceName: capabilities.deviceName,
				appPackage: capabilities.appPackage,
				appActivity: capabilities.appActivity
			};

			// Retreive the server properties
			const server = global.server;

			// Enabling chai assertion style: https://www.npmjs.com/package/chai-as-promised#node
			chai.use(chaiAsPromised);
			chai.should();

			// Enables chai assertion chaining
			chaiAsPromised.transferPromiseness = wd.transferPromiseness;

			// Establish the testing driver
			let driver = wd.promiseChainRemote(server);

			global.platform = cap.platformName; // FIXME: Replace this global, as it's overwritten by each new session

			// If running on a mobile platform, add an automation driver
			if (cap.platformName === 'iOS') {
				cap.automationName = 'XCUITest';
			} else if (cap.platformName === 'Android') {
				cap.deviceReadyTimeout = 60;
				cap.automationName = 'Appium';
			}

			cap.newCommandTimeout = (60 * 10); // Sets the amount of time Appium waits before shutting down in the background

			// If we're running an Android Emulator, launch it now, as this isn't handled by Appium
			if (cap.platformName === 'Android') {
				try {
					(platform === 'android') ? await Device.launchEmu(cap.deviceName) : await Device.launchGeny(cap.deviceName);
				} catch (error) {
					Output.error(error);
				}
			}

			driver.init(cap, err => {
				global.driver = driver;
				global.webdriver = wd;

				(err) ? reject(err) : Output.finish(resolve, null);
			});
		});
	}

	/*****************************************************************************
	 * Stops the WD session, but first it closes and removes the app from the
	 * device, to attempt to save storage space
	 ****************************************************************************/
	static async stopClient() {
		Output.info('Stopping WebDriver Instance... ');

		const driver = global.driver;

		if (driver) {
			switch (global.platformOS) {
				case 'iOS':
					await driver.closeApp();
					await driver.quit();
					await Device.killSim();
					break;

				case 'Android':
					await driver.closeApp();
					await driver.quit();
					await Device.killEmu();
					break;

				default:
					await driver.quit();
			}

			delete global.driver;
		}
	}

	/*****************************************************************************
	 * Launch an Appium server for the mobile testing, as it cannot use the
	 * desktop session
	 ****************************************************************************/
	static runAppium() {
		return new Promise((resolve, reject) => {
			// Retreive the server properties
			const server = global.server;

			Output.info(`Starting Appium Server On '${server.host}:${server.port}'... `);
			// We only want to allow starting a server on the local machine
			const validAddresses = [ 'localhost', '0.0.0.0', '127.0.0.1' ];

			if (validAddresses.includes(server.host)) {
				let exe;

				switch (os.platform()) {
					case 'darwin':
						exe = 'appium';
						break;

					case 'win32':
						exe = 'appium.cmd';
						break;
				}

				let
					appiumExe = path.join(__dirname, '..', 'node_modules', '.bin', exe),
					flags = [ '--log-no-colors', '-a', server.host, '-p', server.port, '--show-ios-log' ];

				const appiumServer = spawn(appiumExe, flags);

				appiumServer.stdout.on('data', output => {
					const line = output.toString().trim();

					const
						regStr = `started on ${server.host}\\:${server.port}$`,
						isRunning = new RegExp(regStr, 'g').test(line);

					if (isRunning) {
						global.appiumServer = appiumServer;

						Output.finish(resolve, null);
					}
				});

				appiumServer.stderr.on('data', output => {
					reject(output.toString());
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
	 ****************************************************************************/
	static async quitServ() {
		Output.info('Stopping Appium Servers... ');

		if (global.appiumServer) {
			await global.appiumServer.kill();

			delete global.appiumServer;
		}

		Output.finish();
	}
}

module.exports = Appium_Helper;
