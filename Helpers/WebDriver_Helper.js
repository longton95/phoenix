'use strict';

const Output = require('./Output_Helper.js');

class WebDriver_Helper {
	/*****************************************************************************
	 * Create and add some custom commands into the webdriver instance, that we
	 * can use in tests later.
	 ****************************************************************************/
	static loadDriverCommands() {
		return new Promise(resolve => {
			Output.info('Loading Custom WebDriver Commands... ');

			const webdriver = global.webdriver;

			/*************************************************************************
			 * Return the OS of the current device.
			 ************************************************************************/
			webdriver.addPromiseMethod('getPlatform', () => {
				return global.platform; // Making a function to return a global, this is such a useful feature right!
			});

			/*************************************************************************
			 * Get the text from the passed UI elements.
			 ************************************************************************/
			webdriver.addElementPromiseMethod('getText', function () {
				switch (global.platform) {
					case 'Mac':
						return this.getAttribute('AXTitle');

					case 'Windows':
						return this.getAttribute('AXTitle'); // Maybe the same? Probably not though, is it ever that easy
				}
			});

			/*************************************************************************
			 * Get the dimensions, and coordinates of an element, then return them.
			 ************************************************************************/
			webdriver.addElementPromiseMethod('getBounds', function () {
				return this
					.getSize()
					.then(size => {
						return this
							.getLocation()
							.then(loc => {
								const bounds = {
									x: loc.x,
									y: loc.y,
									width: size.width,
									height: size.height
								};

								return bounds;
							});
					});
			});

			Output.finish(resolve, null);
		});
	}

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
