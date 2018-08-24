'use strict';

const
	path = require('path'),
	fs = require('fs-extra'),
	app = require('../../Config/Test_Config.js').app,
	appc = require('../../Config/Credentials.js').appc,
	MochaFilter = require('mocha-filter')(global.filters);

const driver = global.studioDriver;

let appLocation;

describe('Generate Project', () => {
	before(async () => {

		await driver
			.sleep(5000) // Wait for the Workspace selector to open
			.elementByClassName('ComboBox')
			.text()
			.then(workspacePath => {

				global.workspace = workspacePath;

				appLocation = path.join(workspacePath, app.appName);

				if (fs.existsSync(appLocation)) {
					// This deletes the project, but Studio still retains it. Need to delete the project from within Studio to run again with the same project name
					fs.removeSync(appLocation);
				}

				fs.existsSync(appLocation).should.equal(false);
			});

		await driver
			.elementByName('Launch')
			.click()
			.sleep(30000) // Wait for Studio to open
			// .SwitchTo().Window(allWindowHandles[0])
			.elementByName('Studio - Axway Appcelerator Studio Dashboard - Axway Appcelerator Studio')
			.isDisplayed().should.become(true);
	});

	it('Open the New Project Window', async () => {
		await driver
			.elementByXPath('/AXApplication/AXMenuBar[0]/AXMenuBarItem[@AXTitle=\'File\']')
			.click()
			.elementByXPath('/AXApplication/AXMenuBar[0]/AXMenuBarItem[@AXTitle=\'File\']/AXMenu[0]/AXMenuItem[@AXTitle=\'New\']')
			.click()
			.elementByXPath('/AXApplication/AXMenuBar[0]/AXMenuBarItem[@AXTitle=\'File\']/AXMenu[0]/AXMenuItem[@AXTitle=\'New\']/AXMenu[0]/AXMenuItem[@AXTitle=\'Mobile App Project\']')
			.click()
			.elementByXPath('/AXApplication/AXWindow[@AXTitle=\'New Mobile App Project\'')
			.isDisplayed().should.become(true);
	});

	it('Select an Alloy Project', async () => {
		await driver
			.elementByXPath('/AXApplication/AXWindow[@AXTitle=\'New Mobile App Project\' and @AXSubrole=\'AXStandardWindow\']/AXScrollArea[1]/AXStaticText[@AXValue=\'Default Alloy Project\']')
			.click()
			.elementByXPath('/AXApplication/AXWindow[@AXTitle=\'New Mobile App Project\' and @AXSubrole=\'AXStandardWindow\']/AXButton[@AXTitle=\'&Next  \']')
			.click()
			.elementByXPath('/AXApplication/AXWindow[@AXTitle=\'New Mobile App Project\' and @AXSubrole=\'AXStandardWindow\']/AXTextField[1]')
			.isDisplayed().should.become(true);
	});

	it('Enter the App Details', async () => {
		await driver
			.elementByXPath('/AXApplication/AXWindow[@AXTitle=\'New Mobile App Project\' and @AXSubrole=\'AXStandardWindow\']/AXTextField[1]')
			.sendKeys(app.appName)
			.elementByXPath('/AXApplication/AXWindow[@AXTitle=\'New Mobile App Project\' and @AXSubrole=\'AXStandardWindow\']/AXGroup[1]/AXTextField[1]')
			.sendKeys(app.packageName)
			.sleep(10000) // Wait, otherwise Studio will skip some setup steps
			.elementByXPath('/AXApplication/AXWindow[@AXTitle=\'New Mobile App Project\' and @AXSubrole=\'AXStandardWindow\']/AXButton[@AXTitle=\'Finish\']')
			.click()
			.sleep(15000)
			.elementByXPath('/AXApplication/AXWindow[@AXTitle=\'Information\' and @AXSubrole=\'AXStandardWindow\']/AXButton[@AXTitle=\'Yes\']')
			.isDisplayed().should.become(true);
	});

	it('Accept First Confirmation Window ', async () => {
		await driver
			.elementByXPath('/AXApplication/AXWindow[@AXTitle=\'Information\' and @AXSubrole=\'AXStandardWindow\']/AXButton[@AXTitle=\'Yes\']')
			.click()
			.sleep(3000)
			.elementByXPath('/AXApplication/AXWindow[@AXTitle=\'Information\' and @AXSubrole=\'AXStandardWindow\']/AXTextField[@AXSubrole=\'AXSecureTextField\']')
			.isDisplayed().should.become(true);
	});

	it('Enter Password into Password Field', async () => {
		await driver
			.elementByXPath('/AXApplication/AXWindow[@AXTitle=\'Information\' and @AXSubrole=\'AXStandardWindow\']/AXTextField[@AXSubrole=\'AXSecureTextField\']')
			.sendKeys(appc.password)
			.elementByXPath('/AXApplication/AXWindow[@AXTitle=\'Information\' and @AXSubrole=\'AXStandardWindow\']/AXButton[@AXTitle=\'OK\']')
			.click()
			.sleep(15000)
			.elementByXPath('/AXApplication/AXWindow[@AXTitle=\'Information\' and @AXSubrole=\'AXStandardWindow\']/AXButton[@AXTitle=\'Yes\']')
			.isDisplayed().should.become(true);
	});

	it('Accept Second Confirmation Window', async () => {
		await driver
			.elementByXPath('/AXApplication/AXWindow[@AXTitle=\'Information\' and @AXSubrole=\'AXStandardWindow\']/AXButton[@AXTitle=\'Yes\']')
			.click()
			.sleep(30000);
		// Add an assertion to something, probably the main window being focused again
	});

	it('Check the Project Was Built Succesfully', async () => {
		// Can't currently assert by UI, as the Scroll View for projects isn't visible to WD
		fs.existsSync(appLocation).should.equal(true);
		// Could probably also check some logs to check on the project generation
	});
});
