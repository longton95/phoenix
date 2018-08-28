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
			.sleep(70000);

		let currWindow = (await driver.windowHandles())[0];

		await driver
			.window(currWindow)
			.elementByName('Studio - Axway Appcelerator Studio Dashboard - Axway Appcelerator Studio')
			.isDisplayed().should.become(true);
	});

	it('Open the New Project Window', async () => {
		await driver
			.elementByName('File')
			.click()
			.elementByName('New	Alt+Shift+N')
			.click()
			.elementByName('Mobile App Project')
			.click()
			.elementByName('Default Alloy Project')
			.isDisplayed().should.become(true);
	});

	it('Select an Alloy Project', async () => {
		await driver
			.elementByName('Default Alloy Project')
			.click()
			.elementByName('&Next  ')
			.click()
			.elementByName('New Mobile App Project')
			.isDisplayed().should.become(true);
	});

	it('Enter the App Details', async () => {
		await driver
			.elementByXPath('//Edit[1]') // Switch to a more reliable XPath, such as defining a name
			.sendKeys(app.appName)
			.elementByXPath('//Group/Pane/Edit[1]') // Switch to a more reliable XPath, such as defining a name
			.sendKeys(app.packageName)
			.sleep(10000) // Wait, otherwise Studio will skip some setup steps
			.elementByName('Finish')
			.click()
			.sleep(30000)
			.elementByName('Would you like to enable the Appcelerator Test service for this app?')
			.isDisplayed().should.become(true);
	});

	it('Accept First Confirmation Window ', async () => {
		await driver
			.elementByName('Yes')
			.click()
			.sleep(10000)
			.elementByName('Please provide your password for enabling Test service:')
			.isDisplayed().should.become(true);
	});

	it('Enter Password into Password Field', async () => {
		await driver
			.elementByXPath('//Edit[1]')
			.sendKeys(appc.password)
			.elementByName('OK')
			.click()
			.sleep(20000)
			.elementByName('Would you like to enable native API access with Hyperloop for this app?')
			.isDisplayed().should.become(true);
	});

	it('Accept Second Confirmation Window', async () => {
		await driver
			.elementByName('Yes')
			.click()
			.sleep(30000)
			.elementByName('TiApp Editor')
			.isDisplayed().should.become(true);
	});

	it('Check the Project Was Built Succesfully', async () => {
		// Can't currently assert by UI, as the Scroll View for projects isn't visible to WD
		fs.existsSync(appLocation).should.equal(true);
		// Could probably also check some logs to check on the project generation
	});
});
