'use strict';

const
	driver = global.driver,
	webdriver = global.webdriver,
	ticket = __filename.split('/').pop().split('.')[0],
	MochaFilter = require('mocha-filter')(global.filters);

describe(ticket, () => {
	afterEach(() => {
		return driver
			.elementByXPath('/AXApplication[@AXTitle=\'Calculator\']/AXWindow[0]/AXGroup[1]/AXButton[@AXDescription=\'clear\']')
			.click()
			.elementByXPath('/AXApplication[@AXTitle=\'Calculator\']/AXWindow[0]/AXGroup[0]/AXStaticText[@AXDescription=\'main display\']')
			.getAttribute('AXValue').should.become('0');
	});

	it('Subtract Two Values, And Check Result', () => {
		return driver
			.elementByXPath('/AXApplication[@AXTitle=\'Calculator\']/AXWindow[0]/AXGroup[1]/AXButton[@AXDescription=\'three\']')
			.click()
			.elementByXPath('/AXApplication[@AXTitle=\'Calculator\']/AXWindow[0]/AXGroup[1]/AXButton[@AXDescription=\'subtract\']')
			.click()
			.elementByXPath('/AXApplication[@AXTitle=\'Calculator\']/AXWindow[0]/AXGroup[1]/AXButton[@AXDescription=\'eight\']')
			.click()
			.elementByXPath('/AXApplication[@AXTitle=\'Calculator\']/AXWindow[0]/AXGroup[1]/AXButton[@AXDescription=\'equals\']')
			.click()
			.elementByXPath('/AXApplication[@AXTitle=\'Calculator\']/AXWindow[0]/AXGroup[0]/AXStaticText[@AXDescription=\'main display\']')
			.getAttribute('AXValue').should.become('-5');
	});
});
