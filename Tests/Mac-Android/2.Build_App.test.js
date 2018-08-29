'use strict';

const
	Appc = require('../../Helpers/Appc_Helper.js'),
	app = require('../../Config/Test_Config.js').app,
	Appium = require('../../Helpers/Appium_Helper.js'),
	spec = require('../../Config/Test_Config.js').android,
	MochaFilter = require('mocha-filter')(global.filters);

const driver = global.studioDriver;

describe('Build App', () => {
	it('Validate Appcelerator Studio Window is Still Open', async () => {
		await driver.elementByXPath('/AXApplication/AXWindow[@AXSubrole=\'AXStandardWindow\']'); // Doesn't actually specify Studio is open, any open window would pass this. TODO: Find out how to make application specific XPaths work for Studio
	});

	global.workspace = '/Users/shaig/Documents/Appcelerator_Studio_Workspace';

	it('Build the App ', async () => {
		await Appc.buildApp(app.appName, spec.platform);

		await Appc
			.checkBuilt(app.appName, spec.platform)
			.should.equal(true);
	});

	it('Launch a WebDriver Instance for the iPhone Simulator', async () => {
		global.mobDriver = await Appium.startClient({
			app: Appc.getAppPath(app.appName, spec.platform),
			deviceName: spec.deviceName,
			platformName: spec.platform,
			platformVersion: spec.platVersion,
			appPackage: spec.appPackage,
			appActivity: spec.appActivity
		});
	});

	it('Check That the Text "Hello World" is Visible', async () => {
		await global.mobDriver
			.elementByAndroidUIAutomator('new UiSelector().text("Hello, World")')
			.isDisplayed().should.become(true);
	});
});
