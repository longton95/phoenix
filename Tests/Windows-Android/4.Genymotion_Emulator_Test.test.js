'use strict';

const
	Appium = require('../../Helpers/Appium_Helper.js'),
	MochaFilter = require('mocha-filter')(global.filters);

// FIXME: Genymotion is sporadic and causes failures in other tests, skipping for now

describe.skip('Genymotion Emulator Test', () => {
	after(async () => {
		await Appium.stopClient();
	});

	before(async () => {
		await Appium.startClient('genymotion');
	});

	it('Click the "Hello World" Text in the App', async () => {
		await global.driver
			.elementByAndroidUIAutomator('new UiSelector().text("Hello, World")')
			.click()
			.elementByAndroidUIAutomator('new UiSelector().text("OK")')
			.isDisplayed().should.become(true);
	});
});
