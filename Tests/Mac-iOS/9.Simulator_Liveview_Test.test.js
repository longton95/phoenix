'use strict';

const
	fs = require('fs'),
	path = require('path'),
	Appc = require('../../Helpers/Appc_Helper.js'),
	Appium = require('../../Helpers/Appium_Helper.js'),
	MochaFilter = require('mocha-filter')(global.filters);

describe('Liveview Test For iOS Simulator', () => {
	after(async () => {
		await Appium.stopClient('simulator');
	});

	before(async () => {
		await Appium.startClient('simulator');
	});

	it('Check That the Text "Hello World" is Visible', async () => {
		await global.driver
			.elementById('Hello, World')
			.isDisplayed().should.become(true);
	});

	it('Change the Background Colour to Blue', async () => {
		let
			rootPath = Appc.genRootPath('App'),
			screenshotsPath = path.join(__dirname, 'Screen_Shots'),
			styleSheet = path.join(rootPath, 'app', 'styles', 'index.tss');

		let
			data = fs.readFileSync(styleSheet),
			result = data.toString().replace('white', 'blue');

		fs.writeFileSync(styleSheet, result);

		await global.driver
			.sleep(5000)
			.elementById('Hello, World')
			.screenshotTest('liveview', 1, screenshotsPath);
	});

	it('Change the Background Colour Back to White', async () => {
		let
			rootPath = Appc.genRootPath('App'),
			screenshotsPath = path.join(__dirname, 'Screen_Shots'),
			styleSheet = path.join(rootPath, 'app', 'styles', 'index.tss');

		let
			data = fs.readFileSync(styleSheet),
			result = data.toString().replace('blue', 'white');

		fs.writeFileSync(styleSheet, result);

		await global.driver
			.sleep(5000)
			.elementById('Hello, World')
			.screenshotTest('liveview', 2, screenshotsPath);
	});
});
