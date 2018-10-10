'use strict';

const
	Appium = require('../../Helpers/Appium_Helper.js'),
	MochaFilter = require('mocha-filter')(global.filters);

describe('Android Studio Emulator Test', () => {
	after(async () => {
		await Appium.stopClient();
	});

	before(async () => {
		await Appium.startClient('android');
	});

	it('Click the "Hello World" Text in the App', async () => {
		await global.driver
			.elementByAndroidUIAutomator('new UiSelector().text("Hello, World")')
			.click()
			.elementByAndroidUIAutomator('new UiSelector().text("OK")')
			.isDisplayed().should.become(true);
	});
});
