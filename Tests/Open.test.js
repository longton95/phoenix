'use strict';

const
	path = require('path'),
	fs = require('fs-extra'),
	appc = require('../Config/Credentials.js').appc,
	MochaFilter = require('mocha-filter')(global.filters);

const
	driver = global.driver,
	webdriver = global.webdriver,
	ticket = __filename.split('/').pop().split('.')[0];

// TODO: Assign these to project variables
const
	appName = 'AppiumTest',
	packageName = 'com.appium.appiumtest';

let appLocation;

describe(ticket, () => {
	before(() => {
		return driver
			.sleep(5000) // Wait for the Workspace selector to open
			.elementByXPath('/AXApplication/AXWindow[0]/AXComboBox')
			.getAttribute('AXValue')
			.then(workspacePath => {

				appLocation = path.join(workspacePath, appName);

				if (fs.existsSync(appLocation)) {
					// This deletes the project, but Studio still retains it. Need to delete the project from within Studio to run again with the same project name
					fs.removeSync(appLocation);
				}

				fs.existsSync(appLocation).should.equal(false);

				return driver
					.elementByXPath('/AXApplication/AXWindow[0]/AXButton[@AXTitle=\'OK\']')
					.click()
					.sleep(30000) // Wait for Studio to open
					.elementByXPath('/AXApplication/AXWindow[0]')
					.getAttribute('AXTitle')
					.then(val => val.should.equal(`Studio - Axway Appcelerator Studio Dashboard - Axway Appcelerator Studio - ${workspacePath}`)); // Originally tried asserting the window name, but appium wasn't having it, so this is the ugly solution
			});
	});

	it('Open the New Project Window', () => {
		return driver
			.elementByXPath('/AXApplication/AXMenuBar[0]/AXMenuBarItem[@AXTitle=\'File\']')
			.click()
			.elementByXPath('/AXApplication/AXMenuBar[0]/AXMenuBarItem[@AXTitle=\'File\']/AXMenu[0]/AXMenuItem[@AXTitle=\'New\']')
			.click()
			.elementByXPath('/AXApplication/AXMenuBar[0]/AXMenuBarItem[@AXTitle=\'File\']/AXMenu[0]/AXMenuItem[@AXTitle=\'New\']/AXMenu[0]/AXMenuItem[@AXTitle=\'Mobile App Project\']')
			.click()
			.elementByXPath('/AXApplication/AXWindow[@AXTitle=\'New Mobile App Project\'')
			.isDisplayed().should.become(true);
	});

	it('Fill Out App Details', function () {
		this.slow(120000);
		this.timeout(120000);

		return driver
			.elementByXPath('/AXApplication/AXWindow[@AXTitle=\'New Mobile App Project\' and @AXSubrole=\'AXStandardWindow\']/AXScrollArea[1]/AXStaticText[@AXValue=\'Default Alloy Project\']')
			.click()
			.elementByXPath('/AXApplication/AXWindow[@AXTitle=\'New Mobile App Project\' and @AXSubrole=\'AXStandardWindow\']/AXButton[@AXTitle=\'&Next  \']')
			.click()
			.elementByXPath('/AXApplication/AXWindow[@AXTitle=\'New Mobile App Project\' and @AXSubrole=\'AXStandardWindow\']/AXTextField[1]')
			.sendKeys(appName)
			.sleep(1000)
			.elementByXPath('/AXApplication/AXWindow[@AXTitle=\'New Mobile App Project\' and @AXSubrole=\'AXStandardWindow\']/AXGroup[1]/AXTextField[1]')
			.sendKeys(packageName)
			.sleep(1000)
			.elementByXPath('/AXApplication/AXWindow[@AXTitle=\'New Mobile App Project\' and @AXSubrole=\'AXStandardWindow\']/AXButton[@AXTitle=\'Finish\']')
			.click()
			.sleep(15000)
			.elementByXPath('/AXApplication/AXWindow[@AXTitle=\'Information\' and @AXSubrole=\'AXStandardWindow\']/AXButton[@AXTitle=\'Yes\']')
			.click()
			.sleep(1000)
			.elementByXPath('/AXApplication/AXWindow[@AXTitle=\'Information\' and @AXSubrole=\'AXStandardWindow\']/AXTextField[@AXSubrole=\'AXSecureTextField\']')
			.sendKeys(appc.password)
			.elementByXPath('/AXApplication/AXWindow[@AXTitle=\'Information\' and @AXSubrole=\'AXStandardWindow\']/AXButton[@AXTitle=\'OK\']')
			.click()
			.sleep(15000)
			.elementByXPath('/AXApplication/AXWindow[@AXTitle=\'Information\' and @AXSubrole=\'AXStandardWindow\']/AXButton[@AXTitle=\'Yes\']')
			.click()
			.sleep(30000)
			.then(() => {
				// Can't currently assert by UI, as the Scroll View for projects isn't visible to WD
				fs.existsSync(appLocation).should.equal(true);
				// Could probably also check some logs to check on the project generation
			});
	});
});
