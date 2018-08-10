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

	it('Add Two Values, And Check Result', () => {
		return driver
			.elementByXPath('/AXApplication[@AXTitle=\'Calculator\']/AXWindow[0]/AXGroup[1]/AXButton[@AXDescription=\'nine\']')
			.click()
			.elementByXPath('/AXApplication[@AXTitle=\'Calculator\']/AXWindow[0]/AXGroup[1]/AXButton[@AXDescription=\'add\']')
			.click()
			.elementByXPath('/AXApplication[@AXTitle=\'Calculator\']/AXWindow[0]/AXGroup[1]/AXButton[@AXDescription=\'seven\']')
			.click()
			.elementByXPath('/AXApplication[@AXTitle=\'Calculator\']/AXWindow[0]/AXGroup[1]/AXButton[@AXDescription=\'equals\']')
			.click()
			.elementByXPath('/AXApplication[@AXTitle=\'Calculator\']/AXWindow[0]/AXGroup[0]/AXStaticText[@AXDescription=\'main display\']')
			.getAttribute('AXValue').should.become('16');
	});
});
