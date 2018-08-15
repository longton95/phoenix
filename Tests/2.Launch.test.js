'use strict';

const MochaFilter = require('mocha-filter')(global.filters);

const
	driver = global.driver,
	webdriver = global.webdriver,
	ticket = __filename.split('/').pop().split('.')[1];

describe(ticket, () => {
	it('Fill Out App Details', async function () {
		this.slow(120000);
		this.timeout(120000);

		await driver.elementByXPath('/AXApplication/AXWindow[@AXSubrole=\'AXStandardWindow\']');

		// FIXME: Application needs to be built between these steps

		// This will be turned into a helper function
		let
			wd = require('wd'),
			chai = require('chai'),
			chaiAsPromised = require('chai-as-promised');

		chai.use(chaiAsPromised);
		chai.should();
		chaiAsPromised.transferPromiseness = wd.transferPromiseness;

		// Hard coding the server for now
		let server = {
			host: 'localhost',
			port: 4723
		};

		// Just some sample capabilities
		let cap = {
			app: '/Users/shaig/Documents/Appcelerator_Studio_Workspace/AppiumTest/build/iphone/build/Products/Debug-iphonesimulator/AppiumTest.app',
			deviceName: 'iPhone 7',
			platformName: 'iOS',
			platformVersion: '11.4',
			automationName: 'XCUITest',
			newCommandTimeout: (60 * 10)
		};

		let driver2 = wd.promiseChainRemote(server);

		await driver2.init(cap);
		await driver2.elementById('Hello, World').click();
	});
});
