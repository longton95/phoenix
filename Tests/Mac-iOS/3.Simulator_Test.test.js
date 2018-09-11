'use strict';

const
	Appc = require('../../Helpers/Appc_Helper.js'),
	Appium = require('../../Helpers/Appium_Helper.js'),
	MochaFilter = require('mocha-filter')(global.filters),
	capabilities = require('../../Config/Test_Config.js').ios;

describe('Simulator Test', () => {
	after(async () => {
		await Appium.stopClient();
	});

	before(async () => {
		await Appium.startClient({
			platformName: capabilities.platform,
			deviceName: capabilities.deviceName,
			app: Appc.getAppPath()
		});
	});

	it('Click the "Hello World" Text in the App', async () => {
		await global.driver
			.elementById('Hello, World')
			.click()
			.elementById('OK')
			.isDisplayed().should.become(true);
	});
});