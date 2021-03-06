'use strict';

const
	Appium = require('../../Helpers/Appium_Helper.js'),
	MochaFilter = require('mocha-filter')(global.filters);

describe('iOS Device Test', () => {
	after(async () => {
		await Appium.stopClient('iosDevice');
	});

	before(async () => {
		await Appium.startClient('iosDevice');
	});

	it('Click the "Hello World" Text in the App', async () => {
		await global.driver
			.elementById('Hello, World')
			.click()
			.elementById('OK')
			.isDisplayed().should.become(true);
	});
});
