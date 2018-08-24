'use strict';

const
	Appium = require('../../Helpers/Appium_Helper.js'),
	Device = require('../../Helpers/Device_Helper.js'),
	MochaFilter = require('mocha-filter')(global.filters);

describe('Simulator Test', () => {
	after(async () => {
		await global.simDriver.closeApp();

		await Appium.stopClient(global.simDriver);

		await Device.killSim('iOS');
	});

	it('Click the "Hello World" Text in the App', async () => {
		await global.simDriver
			.elementById('Hello, World')
			.click()
			.elementById('OK')
			.isDisplayed().should.become(true);
	});
});
