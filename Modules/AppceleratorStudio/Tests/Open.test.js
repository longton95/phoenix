'use strict';

const
	driver = global.driver,
	webdriver = global.webdriver,
	ticket = __filename.split('/').pop().split('.')[0],
	MochaFilter = require('mocha-filter')(global.filters);

describe(ticket, () => {
	before(() => {
		return driver
			.sleep(5000) // Wait for the Workspace selector to open
			.elementByXPath('/AXApplication/AXWindow[0]/AXComboBox')
			.getAttribute('AXValue')
			.then(workspacePath => {
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

	it('Select Option in the First Window', () => {
		return driver
			.elementByXPath('/AXApplication/AXWindow[@AXTitle=\'New Mobile App Project\' and @AXSubrole=\'AXStandardWindow\']/AXScrollArea[1]/AXStaticText[@AXValue=\'Default Alloy Project\']')
			.click()
			.elementByXPath('/AXApplication/AXWindow[@AXTitle=\'New Mobile App Project\' and @AXSubrole=\'AXStandardWindow\']/AXButton[@AXTitle=\'&Next  \']')
			.click()
			.elementByXPath('/AXApplication/AXWindow[@AXTitle=\'New Mobile App Project\' and @AXSubrole=\'AXStandardWindow\']/AXTextField[1]');
	});

	it('Fill Out App Details', () => {
		return driver
			.elementByXPath('/AXApplication/AXWindow[@AXTitle=\'New Mobile App Project\' and @AXSubrole=\'AXStandardWindow\']/AXTextField[1]')
			.sendKeys('AppiumTest')
			.sleep(1000)
			.elementByXPath('/AXApplication/AXWindow[@AXTitle=\'New Mobile App Project\' and @AXSubrole=\'AXStandardWindow\']/AXGroup[1]/AXTextField[1]')
			.sendKeys('com.appium.AppiumTest')
			.sleep(1000)
			.elementByXPath('/AXApplication/AXWindow[@AXTitle=\'New Mobile App Project\' and @AXSubrole=\'AXStandardWindow\']/AXButton[@AXTitle=\'Finish\']')
			.click()
			.sleep(12000)
			.elementByXPath('/AXApplication/AXWindow[@AXTitle=\'Information\' and @AXSubrole=\'AXStandardWindow\']/AXButton[@AXTitle=\'Yes\']')
			.click()
			.sleep(10000);
		// Gets as far as asking for password authentication right now
	});
});
