'use strict';

const
	Appium = require('../../Helpers/Appium_Helper.js'),
	MochaFilter = require('mocha-filter')(global.filters);

describe('Simulator Test', () => {
	after(async () => {
		await Appium.stopClient(global.mobDriver);
	});

	it('Click the "Hello World" Text in the App', async () => {
		await global.mobDriver
			.elementByAndroidUIAutomator('new UiSelector().text("Hello, World")')
			.click()
			.elementByAndroidUIAutomator('new UiSelector().text("OK")')
			.isDisplayed().should.become(true);
	});
});
