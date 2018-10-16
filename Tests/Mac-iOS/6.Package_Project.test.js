'use strict';

const
	path = require('path'),
	tiapp = require('tiapp.xml'),
	Appc = require('../../Helpers/Appc_Helper.js'),
	Appium = require('../../Helpers/Appium_Helper.js'),
	MochaFilter = require('mocha-filter')(global.filters);

describe('Package App (App Store)', () => {
	before('Change the Release Version of the Application Tiapp', () => {
		const
			rootPath = Appc.genRootPath('App'),
			tiappFile = path.join(rootPath, 'tiapp.xml');

		const file = tiapp.load(tiappFile);

		const currDate = Date.now().valueOf();

		file.version = currDate;

		file.write();
	});

	after('Stop the Appium Session', async () => {
		await Appium.stopClient('Mac');
	});

	it('Package the Application', async () => {
		await Appc.packageApp('appstore');
	});

	it('Use Xcode to Upload the app to the Appstore', async function () {
		this.timeout(420000);
		this.slow(400000);

		await Appium.startClient('Mac');

		await global.driver
			.elementByXPath('/AXApplication[@AXTitle=\'Xcode\']/AXWindow[@AXIdentifier=\'_NS:51\']/AXSplitGroup[@AXIdentifier=\'_NS:231\']/AXScrollArea[@AXIdentifier=\'_NS:158\']/AXButton[@AXIdentifier=\'_NS:19\']')
			.click()
			.elementByXPath('/AXApplication[@AXTitle=\'Xcode\']/AXWindow[@AXIdentifier=\'_NS:51\']/AXSheet[@AXIdentifier=\'_NS:63\']/AXScrollArea[@AXIdentifier=\'_NS:74\']/AXTable[@AXIdentifier=\'_NS:48\']/AXRow[@AXSubrole=\'AXTableRow\']/AXCell[0]/AXRadioButton[@AXIdentifier=\'_NS:13\']')
			.click()
			.elementByXPath('/AXApplication[@AXTitle=\'Xcode\']/AXWindow[@AXIdentifier=\'_NS:51\']/AXSheet[@AXIdentifier=\'_NS:63\']/AXButton[@AXIdentifier=\'_NS:127\']')
			.click()
			.elementByXPath('/AXApplication[@AXTitle=\'Xcode\']/AXWindow[@AXIdentifier=\'_NS:51\']/AXSheet[@AXIdentifier=\'_NS:63\']/AXRadioButton[@AXIdentifier=\'_NS:45\']')
			.click()
			.elementByXPath('/AXApplication[@AXTitle=\'Xcode\']/AXWindow[@AXIdentifier=\'_NS:51\']/AXSheet[@AXIdentifier=\'_NS:63\']/AXButton[@AXIdentifier=\'_NS:127\']')
			.click()
			.sleep(10000)
			.elementByXPath('/AXApplication[@AXTitle=\'Xcode\']/AXWindow[@AXIdentifier=\'_NS:51\']/AXSheet[@AXIdentifier=\'_NS:63\']/AXButton[@AXIdentifier=\'_NS:127\']')
			.click()
			.sleep(10000)
			.elementByXPath('/AXApplication[@AXTitle=\'Xcode\']/AXWindow[@AXIdentifier=\'_NS:51\']/AXSheet[@AXIdentifier=\'_NS:63\']/AXScrollArea[@AXIdentifier=\'_NS:95\']/AXPopUpButton[@AXIdentifier=\'_NS:85\']')
			.click()
			.elementByXPath('/AXApplication[@AXTitle=\'Xcode\']/AXWindow[@AXIdentifier=\'_NS:51\']/AXSheet[@AXIdentifier=\'_NS:63\']/AXScrollArea[@AXIdentifier=\'_NS:95\']/AXPopUpButton[@AXIdentifier=\'_NS:85\']/AXMenu[0]/AXMenuItem[@AXTitle=\'AppiumTest\']')
			.click()
			.elementByXPath('/AXApplication[@AXTitle=\'Xcode\']/AXWindow[@AXIdentifier=\'_NS:51\']/AXSheet[@AXIdentifier=\'_NS:63\']/AXButton[@AXIdentifier=\'_NS:127\']')
			.click()
			.sleep(10000)
			.elementByXPath('/AXApplication[@AXTitle=\'Xcode\']/AXWindow[@AXIdentifier=\'_NS:51\']/AXSheet[@AXIdentifier=\'_NS:63\']/AXButton[@AXIdentifier=\'_NS:127\']')
			.click()
			.sleep(300000)
			.elementByXPath('/AXApplication[@AXTitle=\'Xcode\']/AXWindow[@AXIdentifier=\'_NS:51\']/AXSheet[@AXIdentifier=\'_NS:63\']/AXStaticText[@AXValue=\'App "AppiumTest" successfully uploaded.\']')
			.isDisplayed().should.become(true);
	});
});
