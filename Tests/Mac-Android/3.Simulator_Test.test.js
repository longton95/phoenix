'use strict';

const
	Appc = require('../../Helpers/Appc_Helper.js'),
	Appium = require('../../Helpers/Appium_Helper.js'),
	MochaFilter = require('mocha-filter')(global.filters),
	capabilities = require('../../Config/Test_Config.js').android;

describe('Simulator Test', () => {
	after(async () => {
		await Appium.stopClient();
	});

	before(async () => {
		await Appium.startClient({
			app: Appc.getAppPath(),
			platformName: capabilities.platform,
			deviceName: capabilities.deviceName,
			appPackage: capabilities.appPackage,
			appActivity: capabilities.appActivity
		});
	});

	it('Click the "Hello World" Text in the App', async () => {
		await global.driver
			.elementByAndroidUIAutomator('new UiSelector().text("Hello, World")')
			.click()
			.elementByAndroidUIAutomator('new UiSelector().text("OK")')
			.isDisplayed().should.become(true);
	});
});
