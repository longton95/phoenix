'use strict';

const
	fs = require('fs'),
	path = require('path'),
	Appc = require('../../Helpers/Appc_Helper.js'),
	Appium = require('../../Helpers/Appium_Helper.js'),
	MochaFilter = require('mocha-filter')(global.filters),
	capabilities = require('../../Config/Test_Config.js').ios,
	WebDriverHelper = require('../../Helpers/WebDriver_Helper.js');

describe('Liveview Test', () => {
	after(async () => {
		await Appium.stopClient();
	});

	before(async () => {
		await Appium.startClient({
			platformName: capabilities.platform,
			deviceName: capabilities.deviceName,
			app: 'com.appium.appiumtest',
			noReset: true
		});
	});

	it('Check That the Text "Hello World" is Visible', async () => {
		await global.driver
			.elementById('Hello, World')
			.isDisplayed().should.become(true);
	});

	it('Change the background colour', () => {
		let
			rootPath = Appc.genRootPath('App'),
			styleSheet = path.join(rootPath, 'app', 'styles', 'index.tss');

		let data = fs.readFileSync(styleSheet);

		let result = data.toString().replace('white', 'blue');

		fs.writeFileSync(styleSheet, result);
	});

	it('Check That the Text "Hello World" is Visible', async () => {
		let
			screenshotsPath = path.join(__dirname, 'Screen_Shots');

		await WebDriverHelper.loadDriverCommands();
		await global.driver
			.sleep(5000)
			.elementById('Hello, World')
			.screenshotTest('liveview', 1, screenshotsPath);
	});
});
