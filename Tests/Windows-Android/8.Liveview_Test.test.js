'use strict';

const
	fs = require('fs'),
	path = require('path'),
	Appc = require('../../Helpers/Appc_Helper.js'),
	Appium = require('../../Helpers/Appium_Helper.js'),
	MochaFilter = require('mocha-filter')(global.filters),
	WebDriverHelper = require('../../Helpers/WebDriver_Helper.js');

describe('Liveview Test', () => {
	after(async () => {
		await Appium.stopClient();
	});

	before(async () => {
		await Appium.startClient('android');
	});

	it('Check That the Text "Hello World" is Visible', async () => {
		await global.driver
			.elementByAndroidUIAutomator('new UiSelector().text("Hello, World")')
			.isDisplayed().should.become(true);
	});

	it('Change the background colour', () => {
		let
			rootPath = Appc.genRootPath('App'),
			styleSheet = path.join(rootPath, 'app', 'styles', 'index.tss'),
			view = path.join(rootPath, 'app', 'views', 'index.xml');

		let styleSheetData = fs.readFileSync(styleSheet);
		let viewData = fs.readFileSync(view);

		let styleSheetResult = styleSheetData.toString().replace('white', 'blue');
		let viewResult = viewData.toString().replace('Hello, World', 'Hey, You');

		fs.writeFileSync(styleSheet, styleSheetResult);
		fs.writeFileSync(view, viewResult);
	});

	it('Check That the Text "Hello World" is Visible and BG colour has changed', async () => {
		let
			screenshotsPath = path.join(__dirname, 'Screen_Shots');

		await WebDriverHelper.loadDriverCommands();
		await global.driver
			.sleep(5000)
			.elementByAndroidUIAutomator('new UiSelector().text("Hey, You")')
			.isDisplayed().should.become(true)
			.screenshotTest('liveview', 1, screenshotsPath);
	});
});
