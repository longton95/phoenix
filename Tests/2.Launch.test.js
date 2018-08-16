'use strict';

const
	Appium = require('../Helpers/Appium_Helper.js'),
	Device = require('../Helpers/Device_Helper.js'),
	MochaFilter = require('mocha-filter')(global.filters);

const
	driver = global.studioDriver,
	ticket = __filename.split('/').pop().split('.')[1];

describe.only(ticket, () => {
	it('Fill Out App Details', async function () {
		this.slow(120000);
		this.timeout(120000);

		await driver.elementByXPath('/AXApplication/AXWindow[@AXSubrole=\'AXStandardWindow\']');

		// FIXME: Application needs to be built between these steps

		let iosDriver = await Appium.startClient({
			app: '/Users/shaig/Documents/Appcelerator_Studio_Workspace/AppiumTest/build/iphone/build/Products/Debug-iphonesimulator/AppiumTest.app',
			deviceName: 'iPhone 7',
			platformName: 'iOS',
			platformVersion: '11.4',
			automationName: 'XCUITest',
		});

		await iosDriver
			.elementById('Hello, World')
			.click()
			.elementById('OK')
			.isDisplayed().should.become(true);

		await iosDriver.closeApp();

		await Appium.stopClient(iosDriver);

		await Device.killSim('iOS');
	});
});
