'use strict';

const Output = require('./Output_Helper.js');

class WebDriver_Helper {
	/*****************************************************************************
	 * Custom filters used for the tests, to ensure tests run against the correct
	 * platform.
	 ****************************************************************************/
	static addFilters() {
		return new Promise(resolve => {
			Output.info('Loading Custom WebDriver Filters... ');

			global.filters = {
				mac: () => {
					return global.platform === 'Mac';
				},
				windows: () => {
					return global.platform === 'Windows';
				}
			};

			Output.finish(resolve, null);
		});
	}
}

module.exports = WebDriver_Helper;
