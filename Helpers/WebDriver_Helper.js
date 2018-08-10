'use strict';

const
	// path = require('path'),
	// fs = require('fs-extra'),
	// PNGCrop = require('png-crop'),
	// MochaFilter = require('mocha-filter'),
	// resemble = require('node-resemble-js'),
	Output = require('./Output_Helper.js');

class WebDriver_Helper {
	/*****************************************************************************
	 * Create and add some custom commands into the webdriver instance, that we
	 * can use in tests later.
	 ****************************************************************************/
	static loadDriverCommands() {
		return new Promise(resolve => {
			Output.info('Loading Custom WebDriver Commands... ');

			const
				driver = global.driver,
				webdriver = global.webdriver;

			/*************************************************************************
			 * Return the OS of the current device, using the session.
			 ************************************************************************/
			webdriver.addPromiseMethod('getPlatform', () => {
				return driver
					.sessions()
					.then(sessions => {
						return sessions[0].capabilities.platformName;
					});
			});

			/*************************************************************************
			 * Used for hiding the keyboard on Android devices, as it sometimes
			 * focuses on new text fields.
			 ************************************************************************/
			webdriver.addPromiseMethod('dropKeyboard', () => {
				return driver
					.isKeyboardShown()
					.then(shown => {
						if (shown) {
							return driver.hideKeyboard();
						} else {
							return true;
						}
					});
			});

			/*************************************************************************
			 * Used for hiding the keyboard on Android devices, as it sometimes
			 * focuses on new text fields.
			 *
			 * NOTE: Planning to deprecate this method in favour od 'dropKeyboard'
			 ************************************************************************/
			webdriver.addPromiseMethod('androidHideKeyboard', () => {
				return driver
					.getPlatform()
					.then(platform => {
						if (platform === 'Android') {
							return driver.hideKeyboard();
						} else {
							return true;
						}
					});
			});

			/*************************************************************************
			 * Get the text from the passed UI elements.
			 ************************************************************************/
			webdriver.addElementPromiseMethod('getText', function () {
				return driver
					.getPlatform()
					.then(platform => {
						switch (platform) {
							case 'iOS':
								return this.getAttribute('value');

							case 'Android':
								return this.getAttribute('text');
						}
					});
			});

			/*************************************************************************
			 * Accept the alert on the display to clear it away.
			 ************************************************************************/
			webdriver.addPromiseMethod('alertAccept', () => {
				return driver
					.getPlatform()
					.then(platform => {
						switch (platform) {
							case 'iOS':
								return driver
									.elementText('OK')
									.click()
									.sleep(500);

							case 'Android':
								return driver
									.elementsText('OK')
									.then(elements => {
										if (elements.length === 0) {
											return driver
												.back()
												.sleep(500);
										} else {
											return driver
												.elementText('OK')
												.click()
												.sleep(500);
										}
									});
						}
					});
			});

			/*************************************************************************
			 * Equivelant to hitting the return key, do so for the required platform.
			 ************************************************************************/
			webdriver.addPromiseMethod('enter', term => {
				return driver
					.sessions()
					.then(sessions => {
						switch (sessions[0].capabilities.platformName) {
							case 'iOS':
								return driver
									.elementText(term)
									.click();

							case 'Android':
								return driver
									.pressKeycode(66); // Enter key
						}
					});
			});

			/*************************************************************************
			 * Use the backspace key on the keyboard for the required platform.
			 ************************************************************************/
			webdriver.addPromiseMethod('backspace', () => {
				return driver
					.sessions()
					.then(sessions => {
						switch (sessions[0].capabilities.platformName) {
							case 'iOS':
								return driver
									.elementByXPath('//XCUIElementTypeKey[@name="delete"]')
									.click();

							case 'Android':
								return driver
									.pressKeycode(67); // Backspace key
						}
					});
			});

			/*************************************************************************
			 * Return an element, by its platform specific class name.
			 ************************************************************************/
			webdriver.addPromiseMethod('elementClassName', elementType => {
				return driver
					.sessions()
					.then(sessions => {
						const platform = sessions[0].capabilities.platformName;
						return driver.elementByClassName(getElement(elementType, platform));
					});
			});

			/*************************************************************************
			 * Count the number of elements, by its platform specific class name.
			 ************************************************************************/
			webdriver.addPromiseMethod('elementsClassName', elementType => {
				return driver
					.sessions()
					.then(sessions => {
						const platform = sessions[0].capabilities.platformName;
						return driver.elementsByClassName(getElement(elementType, platform));
					});
			});

			/*************************************************************************
			 * Return an element, by its platform specific class name, but allow wait.
			 ************************************************************************/
			webdriver.addPromiseMethod('waitForElementClassName', (elementType, time) => {
				return driver
					.sessions()
					.then(sessions => {
						const platform = sessions[0].capabilities.platformName;
						return driver.waitForElementByClassName(getElement(elementType, platform), webdriver.asserters.isDisplayed, time);
					});
			});

			/*************************************************************************
			 * Return an element, by its platform specific XPath.
			 ************************************************************************/
			webdriver.addPromiseMethod('elementXPath', (elementType, id, position) => {
				return driver
					.sessions()
					.then(sessions => {
						const platform = sessions[0].capabilities.platformName;
						switch (platform) {
							case 'iOS':
								return driver.elementByXPath(`(//${getElement(elementType, platform)}[@name="${id}"])[${position}]`);

							case 'Android':
								return driver.elementByXPath(`(//${getElement(elementType, platform)}[@content-desc="${id}."])[${position}]`);
						}
					});
			});

			/*************************************************************************
			 * Count the number of elements, by its platform specific XPath.
			 ************************************************************************/
			webdriver.addPromiseMethod('elementsXPath', (elementType, id, position) => {
				return driver
					.getPlatform()
					.then(platform => {
						switch (platform) {
							case 'iOS':
								return driver.elementsByXPath(`(//${getElement(elementType, platform)}[@name="${id}"])[${position}]`);

							case 'Android':
								return driver.elementsByXPath(`(//${getElement(elementType, platform)}[@content-desc="${id}."])[${position}]`);
						}
					});
			});

			/*************************************************************************
			 * Return an element, by its platform specific XPath, but allow wait.
			 ************************************************************************/
			webdriver.addPromiseMethod('waitForElementXPath', (elementType, id, position, time) => {
				return driver
					.getPlatform()
					.then(platform => {
						switch (platform) {
							case 'iOS':
								return driver.waitForElementByXPath(`(//${getElement(elementType, platform)}[@name="${id}"])[${position}]`, webdriver.asserters.isDisplayed, time);

							case 'Android':
								return driver.waitForElementByXPath(`(//${getElement(elementType, platform)}[@content-desc="${id}."])[${position}]`, webdriver.asserters.isDisplayed, time);
						}
					});
			});

			/*************************************************************************
			 * Return an element, by its ID.
			 ************************************************************************/
			webdriver.addPromiseMethod('elementId', (element) => {
				return driver
					.sessions()
					.then(sessions => {
						switch (sessions[0].capabilities.platformName) {
							case 'iOS':
								return driver.elementById(element);

							case 'Android':
								return driver.elementById(`${element}.`);
						}
					});
			});

			/*************************************************************************
			 * Count the number of elements, by its ID.
			 ************************************************************************/
			webdriver.addPromiseMethod('elementsId', (element) => {
				return driver
					.sessions()
					.then(sessions => {
						switch (sessions[0].capabilities.platformName) {
							case 'iOS':
								return driver.elementsById(element);

							case 'Android':
								return driver.elementsById(`${element}.`);
						}
					});
			});

			/*************************************************************************
			 * Return an element, by its ID, but allow wait.
			 ************************************************************************/
			webdriver.addPromiseMethod('waitForElementId', (elementType, time) => {
				return driver
					.getPlatform()
					.then(platform => {
						switch (platform) {
							case 'iOS':
								return driver.waitForElementById(elementType, webdriver.asserters.isDisplayed, time);

							case 'Android':
								return driver.waitForElementById(`${elementType}.`, webdriver.asserters.isDisplayed, time);
						}
					});
			});

			/*************************************************************************
			 * Return an element, by its text content.
			 ************************************************************************/
			webdriver.addPromiseMethod('elementText', (text, preserve) => {
				return driver
					.sessions()
					.then(sessions => {
						switch (sessions[0].capabilities.platformName) {
							case 'iOS':
								return driver.elementById(text);

							case 'Android':
								function titleCase(str) {
									return str.replace(
										/\w\S*/g,
										function (txt) {
											return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
										}
									);
								}

								// Get the Android platform version from the Appium session
								let version = parseFloat(sessions[0].capabilities.platformVersion).toFixed(2);

								// Alter the string depending on the Android version
								if (version >= 7.0) {
									if (!preserve) {
										text = text.toUpperCase();
									}
								} else if (!preserve) {
									text = titleCase(text);
								}

								return driver.elementByAndroidUIAutomator(`new UiSelector().text("${text}")`);
						}
					});
			});

			/*************************************************************************
			 * Count the number of elements, by its text content.
			 ************************************************************************/
			webdriver.addPromiseMethod('elementsText', (text, preserve) => {
				return driver
					.sessions()
					.then(sessions => {
						switch (sessions[0].capabilities.platformName) {
							case 'iOS':
								return driver.elementsById(text);

							case 'Android':
								function titleCase(str) {
									return str.replace(
										/\w\S*/g,
										function (txt) {
											return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
										}
									);
								}

								// Get the Android platform version from the Appium session
								let version = parseFloat(sessions[0].capabilities.platformVersion).toFixed(2);

								// Alter the string depending on the Android version
								if (version >= 7.0) {
									if (!preserve) {
										text = text.toUpperCase();
									}
								} else if (!preserve) {
									text = titleCase(text);
								}

								return driver.elementsByAndroidUIAutomator(`new UiSelector().text("${text}")`);
						}
					});
			});

			/*************************************************************************
			 * Return an element, by its text content, but allow wait.
			 ************************************************************************/
			webdriver.addPromiseMethod('waitForElementText', (text, time, preserve) => {
				return driver
					.sessions()
					.then(sessions => {
						switch (sessions[0].capabilities.platformName) {
							case 'iOS':
								return driver.waitForElementById(text, webdriver.asserters.isDisplayed, time);

							case 'Android':
								function titleCase(str) {
									return str.replace(
										/\w\S*/g,
										function (txt) {
											return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
										}
									);
								}

								// Get the Android platform version from the Appium session
								let version = parseFloat(sessions[0].capabilities.platformVersion).toFixed(2);

								// Alter the string depending on the Android version
								if (version >= 7.0) {
									if (!preserve) {
										text = text.toUpperCase();
									}
								} else if (!preserve) {
									text = titleCase(text);
								}

								return driver.waitForElementByAndroidUIAutomator(`new UiSelector().text("${text}")`, webdriver.asserters.isDisplayed, time);
						}
					});
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

			/*************************************************************************
			 * Longpress on the passed element.
			 ************************************************************************/
			webdriver.addElementPromiseMethod('longpress', function () {
				return this
					.getSize()
					.then(size => {
						return this
							.getLocation()
							.then(loc => {
								const action = new webdriver.TouchAction()
									.press({
										x: (loc.x + (size.width / 2)),
										y: (loc.y + (size.height / 2))
									})
									.wait(3000)
									.release();

								return driver.performTouchAction(action);
							});
					});
			});

			/*************************************************************************
			 * Double click on the passed element.
			 ************************************************************************/
			webdriver.addElementPromiseMethod('doubleClick', function () {
				return this
					.getSize()
					.then(size => {
						return this
							.getLocation()
							.then(loc => {
								const action = new webdriver.TouchAction()
									.press({
										x: (loc.x + (size.width / 2)),
										y: (loc.y + (size.height / 2))
									})
									.release();

								return driver
									.performTouchAction(action)
									.performTouchAction(action);
							});
					});
			});

			/*************************************************************************
			 * Scroll up on the entire height of the passed element.
			 ************************************************************************/
			webdriver.addElementPromiseMethod('scrollUp', function () {
				return this
					.getSize()
					.then(size => {
						return this
							.getLocation()
							.then(loc => {
								const action = new webdriver.TouchAction()
									.press({
										x: (loc.x + (size.width / 2)),
										y: (loc.y + 20)
									})
									.moveTo({
										x: (loc.x + (size.width / 2)),
										y: (loc.y + size.height - 20)
									})
									.release();

								return driver.performTouchAction(action);
							});
					});
			});

			/*************************************************************************
			 * Scroll down on the entire height of the passed element.
			 ************************************************************************/
			webdriver.addElementPromiseMethod('scrollDown', function () {
				return this
					.getSize()
					.then(size => {
						return this
							.getLocation()
							.then(loc => {
								const action = new webdriver.TouchAction()
									.press({
										x: (loc.x + (size.width / 2)),
										y: (loc.y + (size.height - 20))
									})
									.moveTo({
										x: (loc.x + (size.width / 2)),
										y: (loc.y + 20)
									})
									.release();

								return driver.performTouchAction(action);
							});
					});
			});

			/*************************************************************************
			 * Swipe right across the entire width of the passed element.
			 ************************************************************************/
			webdriver.addElementPromiseMethod('swipeRight', function () {
				return this
					.getSize()
					.then(size => {
						return this
							.getLocation()
							.then(loc => {
								const action = new webdriver.TouchAction()
									.press({
										x: (loc.x + (size.width - 5)),
										y: (loc.y + (size.height / 4))
									})
									.moveTo({
										x: (loc.x + (size.width / 2)),
										y: (loc.y + (size.height / 4))
									})
									.wait(100)
									.moveTo({
										x: (loc.x + 5),
										y: (loc.y + (size.height / 4))
									})
									.wait(100)
									.release();

								return driver.performTouchAction(action);
							});
					});
			});

			/*************************************************************************
			 * Swipe left across the entire width of the passed element.
			 ************************************************************************/
			webdriver.addElementPromiseMethod('swipeLeft', function () {
				return this
					.getSize()
					.then(size => {
						return this
							.getLocation()
							.then(loc => {
								const action = new webdriver.TouchAction()
									.press({
										x: (loc.x + 5),
										y: (loc.y + (size.height / 4))
									})
									.moveTo({
										x: (loc.x + (size.width / 2)),
										y: (loc.y + (size.height / 4))
									})
									.wait(100)
									.moveTo({
										x: (loc.x + size.width - 5),
										y: (loc.y + (size.height / 4))
									})
									.wait(100)
									.release();

								return driver.performTouchAction(action);
							});
					});
			});

			/*************************************************************************
			 * Check that a message appears in the device log.
			 ************************************************************************/
			webdriver.addPromiseMethod('shouldLog', searchStrings => {
				return driver.sessions()
					.then(sessions => {
						let logType;

						if (sessions[0].capabilities.platformName === 'iOS') {
							logType = 'syslog';
						}
						if (sessions[0].capabilities.platformName === 'Android') {
							logType = 'logcat';
						}

						return driver
							.sleep(1000)
							.log(logType)
							.then(log => {
								let messages = [];

								// Capture only the messages from the log
								log.forEach(item => messages.push(item.message));

								searchStrings.forEach(searchString => {
									const
										formatted = searchString.replace(/[-[\]{}()*+?.,\\/^$|#\s]/g, '\\$&'),
										expression = new RegExp(formatted);

									messages.should.include.match(expression);
								});
							});
					});
			});

			/*************************************************************************
			 * Check that a message doesn't appear in the device log.
			 ************************************************************************/
			webdriver.addPromiseMethod('shouldNotLog', searchStrings => {
				return driver.sessions()
					.then(sessions => {
						let logType;

						if (sessions[0].capabilities.platformName === 'iOS') {
							logType = 'syslog';
						}
						if (sessions[0].capabilities.platformName === 'Android') {
							logType = 'logcat';
						}

						return driver
							.sleep(500)
							.log(logType)
							.then(log => {
								let messages = [];

								// Capture only the messages from the log
								log.forEach(item => messages.push(item.message));

								searchStrings.forEach(searchString => {
									const
										formatted = searchString.replace(/[-[\]{}()*+?.,\\/^$|#\s]/g, '\\$&'),
										expression = new RegExp(formatted);

									messages.should.not.include.match(expression);
								});
							});
					});
			});

			/*************************************************************************
			 * Count the amount of times a message appears in a log.
			 ************************************************************************/
			webdriver.addPromiseMethod('countLog', (searchStrings, iterations) => {
				return driver.sessions()
					.then(sessions => {
						let logType;

						if (sessions[0].capabilities.platformName === 'iOS') {
							logType = 'syslog';
						}
						if (sessions[0].capabilities.platformName === 'Android') {
							logType = 'logcat';
						}

						return driver
							.sleep(500)
							.log(logType)
							.then(log => {
								let messages = [];

								// Capture only the messages from the log
								log.forEach(item => {
									searchStrings.forEach(searchString => {
										const
											formatted = searchString.replace(/[-[\]{}()*+?.,\\/^$|#\s]/g, '\\$&'),
											expression = new RegExp(formatted);

										if (item.message.match(expression)) {
											messages.push(item.message);
										}
									});
								});

								messages.length.should.equal(iterations);
							});
					});
			});

			/*************************************************************************
			 * Used to find a ticket in the first page of an acceptance app.
			 ************************************************************************/
			webdriver.addPromiseMethod('searchForTicket', ticket => {
				ticket = ticket.replace(/-/g, '');
				return driver.sessions()
					.then(sessions => {
						if (sessions[0].capabilities.platformName === 'iOS') {
							return driver
								.waitForElementByClassName('XCUIElementTypeSearchField', webdriver.asserters.isDisplayed, 3000)
								.click()
								.sendKeys(ticket)
								.elementByXPath('(//XCUIElementTypeCell)[1]')
								.click();
						} else if (sessions[0].capabilities.platformName === 'Android') {
							return driver
								.elementByClassName('android.widget.EditText')
								.clear()
								.sendKeys(ticket)
								.elementByXPath(`(//android.widget.TextView[@text="${ticket}"])`)
								.click()
								.waitForElementByXPath(`(//android.widget.TextView[@text="${ticket}"])`, webdriver.asserters.isDisplayed, 10000);
						}
					});
			});

			/*************************************************************************
			 * Used to find a ticket in the first page of an acceptance app, but will
			 * expect an alert to be present as soon as the acceptance app loads.
			 ************************************************************************/
			webdriver.addPromiseMethod('searchForTicketWithAlert', ticket => {
				ticket = ticket.replace('-', '');
				return driver.sessions()
					.then(sessions => {
						if (sessions[0].capabilities.platformName === 'iOS') {
							return driver
								.waitForElementByClassName('XCUIElementTypeSearchField', webdriver.asserters.isDisplayed, 3000)
								.click()
								.sendKeys(ticket)
								.elementByXPath('(//XCUIElementTypeCell)[1]')
								.click();
						} else if (sessions[0].capabilities.platformName === 'Android') {
							return driver
								.elementByClassName('android.widget.EditText')
								.clear()
								.sendKeys(ticket)
								.elementByXPath(`(//android.widget.TextView[@text="${ticket}"])`)
								.click()
								.waitForElementByAndroidUIAutomator('new UiSelector().text("Alert")', webdriver.asserters.isDisplayed, 10000);
						}
					});
			});

			// /********************* ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** **
			//  * Compares a screenshot of the app in its current state, to a stored
			//  * reference image to see how they match. (Removes the status bar from
			//  * image for more reliability).
			//  ************************************************************************/
			// webdriver.addPromiseMethod('screenshotTest', (ticket, number, directory, thresh) => {
			// 	return new Promise((resolve, reject) => {
			// 		driver.sessions()
			// 			.then(sessions => {
			// 				const platform = sessions[0].capabilities.platformName;
			//
			// 				switch (platform) {
			// 					case 'iOS':
			// 					// Get the size of the window frame
			// 						driver
			// 							.elementByClassName('XCUIElementTypeApplication')
			// 							.getSize()
			// 							.then(windowSize => {
			// 							// Get the size of the status bar
			// 								driver
			// 									.elementByClassName('XCUIElementTypeStatusBar')
			// 									.getSize()
			// 									.then(statusSize => {
			// 									// Create the config for PNGCrop to use
			// 										let dimensions = {
			// 											height: (windowSize.height * 2),
			// 											width: (windowSize.width * 2),
			// 											top: (statusSize.height * 2)
			// 										};
			// 										// Take the screenshot
			// 										driver
			// 											.sleep(2000)
			// 											.takeScreenshot()
			// 											.then(screenshot => processImg(`${ticket}_${platform}_${number}`, screenshot, directory, thresh, dimensions))
			// 											.then(() => resolve())
			// 											.catch(err => reject(err));
			// 									});
			// 							});
			// 						break;
			//
			// 					case 'Android':
			// 						driver
			// 							.sleep(1000)
			// 							.elementsById('android:id/statusBarBackground')
			// 							.then(elements => {
			// 								if (elements.length > 0) {
			// 								// Get the size of the window frame
			// 									driver
			// 										.elementByXPath('//android.widget.FrameLayout[@instance="0"]')
			// 										.getSize()
			// 										.then(frameSize => {
			// 										// Get the size of the navigation bar
			// 											driver
			// 												.elementById('android:id/navigationBarBackground')
			// 												.getSize()
			// 												.then(navSize => {
			// 												// Get the size of the status bar
			// 													driver
			// 														.elementById('android:id/statusBarBackground')
			// 														.getSize()
			// 														.then(statusSize => {
			// 														// Create the full window height
			// 															const
			// 																windowWidth = (frameSize.width),
			// 																windowHeight = (frameSize.height - (navSize.height * 1.5));
			//
			// 															// Create the config for PNGCrop to use
			// 															let dimensions = {
			// 																height: (windowHeight),
			// 																width: (windowWidth),
			// 																top: (statusSize.height)
			// 															};
			//
			// 															// Take the screenshot
			// 															driver
			// 																.sleep(1000)
			// 																.takeScreenshot()
			// 																.then(screenshot => processImg(`${ticket}_${platform}_${number}`, screenshot, directory, thresh, dimensions))
			// 																.then(() => resolve())
			// 																.catch(err => reject(err));
			// 														});
			// 												});
			// 										});
			// 								} else {
			// 								// Take the screenshot
			// 									driver
			// 										.sleep(1000)
			// 										.takeScreenshot()
			// 										.then(screenshot => processImg(`${ticket}_${platform}_${number}`, screenshot, directory, thresh))
			// 										.then(() => resolve())
			// 										.catch(err => reject(err));
			// 								}
			// 							});
			// 				}
			// 			});
			// 	});
			// });

			// /*************************************************************************
			//  * Compares a screenshot of the app in its current state, to a stored
			//  * reference image to see how they match. (Leaves the status bar in, for
			//  * tests which may require it).
			//  ************************************************************************/
			// webdriver.addPromiseMethod('fullScreenshotTest', (ticket, number, directory, thresh) => {
			// 	return new Promise((resolve, reject) => {
			// 		driver.sessions()
			// 			.then(sessions => {
			// 				const platform = sessions[0].capabilities.platformName;
			//
			// 				switch (platform) {
			// 					case 'iOS':
			// 					// Take the screenshot
			// 						driver
			// 							.sleep(2000)
			// 							.takeScreenshot()
			// 							.then(screenshot => processImg(`${ticket}_${platform}_${number}`, screenshot, directory, thresh))
			// 							.then(() => resolve())
			// 							.catch(err => reject(err));
			// 						break;
			//
			// 					case 'Android':
			// 					// Take the screenshot
			// 						driver
			// 							.sleep(1000)
			// 							.takeScreenshot()
			// 							.then(screenshot => processImg(`${ticket}_${platform}_${number}`, screenshot, directory, thresh))
			// 							.then(() => resolve())
			// 							.catch(err => reject(err));
			// 				}
			// 			});
			// 	});
			// });

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
				ios: () => {
					return global.platform === 'iOS';
				},
				android: () => {
					return global.platform === 'Android';
				}
			};

			Output.finish(resolve, null);
		});
	}
}

module.exports = WebDriver_Helper;

// function processImg(ticket, screenshot, directory, thresh, dimensions) {
// 	return new Promise((resolve, reject) => {
// 		const
// 			testPath = path.join(global.projRoot, 'Logs', global.timestamp, 'Screen_Shots'),
// 			refPath = path.join(directory, '..', 'Screen_Shots'),
// 			testImg = path.join(testPath, `${ticket}_Failure.png`),
// 			reference = path.join(refPath, `${ticket}.png`);
//
// 		let imgPath;
//
// 		// If the gather flag has been supplied, overwrite the existing screenshot
// 		if (global.screenshot) {
// 			imgPath = reference;
// 		} else {
// 			imgPath = testImg;
// 		}
//
// 		writeImg(screenshot, imgPath)
// 			.then(() => cropImg(imgPath, dimensions))
// 			.then(() => compImg(testImg, reference, thresh))
// 			.then(() => resolve())
// 			.catch(err => reject(err));
// 	});
// }
//
// function writeImg(screenshot, path) {
// 	return new Promise((resolve, reject) => {
// 		fs.writeFile(path, screenshot, 'base64', (writeErr) => {
// 			if (writeErr) {
// 				reject(writeErr);
// 			} else {
// 				resolve();
// 			}
// 		});
// 	});
// }
//
// function cropImg(imgPath, dimensions) {
// 	return new Promise((resolve, reject) => {
//
// 		if (!dimensions) {
// 			resolve();
// 		}
//
// 		PNGCrop.crop(imgPath, imgPath, dimensions, (cropErr) => {
// 			if (cropErr) {
// 				reject(cropErr);
// 			} else {
// 				resolve(imgPath);
// 			}
// 		});
// 	});
// }

// /*******************************************************************************
//  * Take the screenshot from the mocha test, write it to a file, and compare it
//  * to the reference screenshot. If it does not meet a similarity threshold
//  * then fail the test. If it does, remove the file and pass the test.
//  *
//  * @param {String} ticket - The ticket of the test being run
//  * @param {String} test - The directory of the test files
//  * @param {String} screenshot - A Base64 string of the screenshot data
//  * @param {Decimal} thresh - A custom defined image matching threshold
//  * @param {Object} dimensions - The cropping dimension based on the window size
//  ******************************************************************************/
// function compImg(testImg, reference, thresh) {
// 	return new Promise((resolve, reject) => {
//
// 		if (global.screenshot) {
// 			return resolve();
// 		}
//
// 		let threshold = 0.10;
//
// 		// If a custom threshold was defined, use that instead
// 		if (thresh) {
// 			threshold = thresh;
// 		}
//
// 		resemble(testImg).compareTo(reference).onComplete((difference) => {
// 			if (difference.misMatchPercentage <= threshold) {
// 				fs.unlinkSync(testImg);
// 				resolve();
// 			} else {
// 				reject(new Error(`Images didn't meet required threshold, wanted below: ${threshold}%, got: ${difference.misMatchPercentage}%`));
// 			}
// 		});
// 	});
// }

function getElement(elementType, platform) {
	switch (platform) {
		case 'iOS':
			switch (elementType) {
				case 'TextField':
					return 'XCUIElementTypeStaticText';

				case 'TableView':
					return 'XCUIElementTypeTable';

				case 'Button':
					return 'XCUIElementTypeButton';

				case 'TableViewRow':
					return 'XCUIElementTypeCell';

				case 'OptionDialog':
					return 'XCUIElementTypeSheet';

				case 'SearchField':
					return 'XCUIElementTypeSearchField';

				case 'DatePicker':
					return 'XCUIElementTypeDatePicker';

				case 'Window':
					return 'XCUIElementTypeWindow';

				case 'WebView':
					return 'XCUIElementTypeWebView';

				case 'ImageView':
					return 'XCUIElementTypeImage';

				case 'StatusBar':
					return 'XCUIElementTypeStatusBar';

				case 'KeyBoard':
					return 'XCUIElementTypeKeyboard';

				case 'ToolBar':
					return 'XCUIElementTypeToolbar';

				case 'PagingControl':
					return 'XCUIElementTypePageIndicator';

				case 'Other':
					return 'XCUIElementTypeOther';
			}
			break;

		case 'Android':
			switch (elementType) {
				case 'TextField':
					return 'android.widget.TextView';

				case 'DatePicker':
					return 'android.widget.DatePicker';

				case 'SearchField':
					return 'android.widget.EditText';

				case 'TableView':
					return 'android.widget.ListView';

				case 'Window':
					return 'android.view.ViewGroup';

				case 'TableViewRow':
					return 'android.view.ViewGroup';

				case 'WebView':
					return 'android.webkit.WebView';

				case 'ImageView':
					return 'android.widget.ImageView';

				case 'StatusBar':
					return 'android.view.View'; // Could be any number of views, needs to be more specific

				case 'Other':
					return 'android.view.ViewGroup';
			}
			break;
	}
}
