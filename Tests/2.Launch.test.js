'use strict';

const
	Appc = require('../Helpers/Appc_Helper.js'),
	app = require('../Config/Test_Config.js').app,
	spec = require('../Config/Test_Config.js').ios,
	Appium = require('../Helpers/Appium_Helper.js'),
	Device = require('../Helpers/Device_Helper.js'),
	MochaFilter = require('mocha-filter')(global.filters);

const
	driver = global.studioDriver,
	ticket = __filename.split('/').pop().split('.')[1];

let iosDriver;

describe(ticket, () => {
	it('Validate Appcelerator Studio Window is Still Open', async () => {

		await driver.elementByXPath('/AXApplication/AXWindow[@AXSubrole=\'AXStandardWindow\']');
	});

	it('Build the App', async () => {
		await Appc.buildApp(app.appName, spec.platform);

		await Appc
			.checkBuilt(app.appName, spec.platform)
			.should.equal(true);
	});

	it('Launch a WebDriver Instance for the iPhone', async () => {
		iosDriver = await Appium.startClient({
			app: Appc.getAppPath(app.appName, spec.platform),
			deviceName: spec.deviceName,
			platformName: spec.platform,
			platformVersion: spec.platVersion,
		});
	});

	it('Click the "Hello World" Text in the App', async () => {
		await iosDriver
			.elementById('Hello, World')
			.click()
			.elementById('OK')
			.isDisplayed().should.become(true);
	});

	it('Close the iPhone Instance', async () => {
		await iosDriver.closeApp();

		await Appium.stopClient(iosDriver);

		await Device.killSim('iOS');
	});
});
