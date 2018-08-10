'use strict';

const
	fs = require('fs'),
	path = require('path'),
	request = require('request'),
	Output = require('./Output_Helper.js'),
	creds = require('../Config/Credentials.js').jira;

// Use the username and password to generate a base64 string, used to authenticate with JIRA
const
	comb = `${creds.username}:${creds.password}`,
	encodedComb = new Buffer(comb).toString('base64');

class Zephyr_Helper {
	/*****************************************************************************
	 * Use the JIRA and Zephyr APIs to update a given ticket with a test result.
	 *
	 * @param {String} ticket - The ticket to be updated
	 * @param {String} moduleName - The module being tested
	 * @param {String} status - The new status for the test execution
	 * @param {Array[String]} comment - Array containing the comments for the test
	 * @param {String} cycleId - The Zephyr ID for the test cycle
	 * @param {String} platform - The OS being run on
	 ****************************************************************************/
	static update(ticket, moduleName, status, comment, cycleId, platform) {
		return new Promise((resolve, reject) => {
			Output.info(`Updating Zephyr Test For Issue '${ticket}'... `);

			if (!global.update) {
				Output.skip(resolve, null);
			} else {
				let
					execId,
					issueId,
					zephyrTic;

				Promise.resolve()
					// Use the test ticket name to find the Zephyr ticket ID
					.then(() => getZephyr(ticket, moduleName))
					// Assign the found value to the zephyrTic
					.then(value => zephyrTic = value)
					// Get the JIRA ID for the Zephyr ticket that needs updating
					.then(() => getZephyrId(zephyrTic))
					// Assign the found value to the issueId
					.then(value => issueId = value)
					// Use the Zephyr ticket ID and the test cycle ID to get the Zephyr ID of the test execution that needs to be updated
					.then(() => getExecution(issueId, cycleId, zephyrTic))
					// Assign the found value to the execId
					.then(value => execId = value)
					// Use the execution ID to update the ticket to being unexecuted
					.then(() => resetTicket(execId))
					// Use the execution ID to update the ticket with the relevant test update information
					.then(() => updateTicket(execId, status, comment))
					// Get images currently attatched to the execution
					.then(() => getImages(execId))
					// Remove them from the execution, as they're old and outdated
					.then(imageIds => deleteImages(imageIds))
					// If there are some new images, attatch them to the execution
					.then(() => uploadImages(moduleName, execId, ticket, platform))
					// Resolve the chain
					.then(() => Output.finish(resolve, null))
					// Check the issue, if it's a string then it's a message to be displayed
					.catch(err => {
						if (typeof(err) === 'string') {
							Output.error(err);
							resolve();
						} else {
							reject(err);
						}
					});
			}
		});
	}

	/*****************************************************************************
	 * Use the JIRA and Zephyr APIs to retrieve the Cycle ID for the current test
	 * run. Only needs to be done once so is seperated from the rest of the API
	 * calls
	 *
	 * @param {String} platforms - Mobile OSs selected for this test run
	 * @param {String} appcSDK - The SDK version desired for testing
	 ****************************************************************************/
	static getCycleIds(platforms, appcSDK) {
		return new Promise((resolve, reject) => {
			Output.info('Retreiving Zephyr Test Cycle IDs... ');

			if (!global.update) {
				Output.skip(resolve, null);
			} else {
				let p = Promise.resolve();

				Object.keys(platforms).forEach(platform => {
					let hostOS = process.platform;

					// Match the host name to what will be used in JIRA/Zephyr
					if (hostOS === 'darwin') {
						hostOS = 'Mac';
					}

					const
						release = `Release ${appcSDK.split('.').slice(0, 3).join('.')}`,
						cycleName = `Appium ${release} ${hostOS}-${platform}`;

					let
						releaseId,
						projectId,
						projectKey = 'TIMOB'; // I'm assuming we're not testing any other projects

					p = p
						// Get the JIRA ID value for the project that the test belongs to
						.then(() => getProject(projectKey))
						// Assign the found value to the projectId
						.then(value => projectId = value)
						// Get the JIRA ID for the release version that is being tested for
						.then(() => getRelease(projectId, release))
						// Assign the found value to the releaseId
						.then(value => releaseId = value)
						// Use the project ID and the release version ID to find the Zephyr ID for the test cycle
						.then(() => getCycle(projectId, releaseId, cycleName))
						// Assign the ID
						.then(value => platforms[platform].cycleId = value);
				});

				p
					.then(() => Output.finish(resolve, null))
					// Handle Errors
					.catch(err => reject(err));
			}
		});
	}
}

module.exports = Zephyr_Helper;

/*******************************************************************************
 * Use the issue ticket number to get the Zephyr test ticket for the issue
 *
 * @param {String} ticket - The ticket number of the issue
 * @param {String} moduleName - The module being tested
 ******************************************************************************/
function getZephyr(ticket, moduleName) {
	return new Promise((resolve, reject) => {

		let mod = moduleName.replace(/_/g, '');

		const data = {
			url: 'https://jira.appcelerator.org/rest/api/latest/search',
			body: `{"jql":"project = TIMOB AND issuetype = Test AND text ~ '${mod} ${ticket}'"}`,
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Basic ${encodedComb}`
			}
		};

		makeRequest(data)
			.then(response => {
				try {
					resolve(response.issues[0].key);
				} catch (err) {
					reject('Can\'t Find Matching Zephyr Ticket For Issue');
				}
			})
			.catch(err => reject(err));
	});
}

/*******************************************************************************
 * Use the Zephyr ticket number to get its ID value
 *
 * @param {String} zephyrTic - The ticket number of the Zephyr test
 ******************************************************************************/
function getZephyrId(zephyrTic) {
	return new Promise((resolve, reject) => {
		const data = {
			url: `https://jira.appcelerator.org/rest/api/latest/issue/${zephyrTic}`,
			body: '{}',
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Basic ${encodedComb}`
			}
		};

		makeRequest(data)
			.then(response => {
				try {
					resolve(response.id);
				} catch (err) {
					reject(`Couldn't Find Issue ${zephyrTic}`);
				}
			})
			.catch(err => reject(err));
	});
}

/*******************************************************************************
 * Get the ID value for the test execution, by using the ID from the issue, the
 * ID from the cycle, and the Zephyr ticket number
 *
 * @param {String} issueId - The ID of the issue
 * @param {String} cycleId - The ID of the cycle
 * @param {String} zephyrTic - The ticket number of the Zephyr test
 ******************************************************************************/
function getExecution(issueId, cycleId, zephyrTic) {
	return new Promise((resolve, reject) => {
		const data = {
			url: `https://jira.appcelerator.org/rest/zapi/latest/execution?issueId=${issueId}&cycleId=${cycleId}`,
			body: '{}',
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Basic ${encodedComb}`
			}
		};

		makeRequest(data)
			.then(response => {
				try {
					resolve(response.executions[0].id);
				} catch (err) {
					reject(`Could Not Find Any Executions in the Ticket ${zephyrTic} for the requested test cycle`);
				}
			})
			.catch(err => reject(err));
	});
}

/*******************************************************************************
 * Change the status of the test execution to unexecuted, so that the execution
 * date will be updated for the ticket. Otherwise if the status stays the same,
 * the execution date will not be updated
 *
 * @param {String} execId - The execution ID of the Zephyr test
 ******************************************************************************/
function resetTicket(execId) {
	return new Promise((resolve, reject) => {
		const data = {
			url: `https://jira.appcelerator.org/rest/zapi/latest/execution/${execId}/execute`,
			body: '{"status":"-1", "comment":"Resetting Ticket..."}',
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Basic ${encodedComb}`
			}
		};

		makeRequest(data)
			.then(() => resolve())
			.catch(err => reject(err));
	});
}

/*******************************************************************************
 * Change the status of the test execution, and leave a comment on the ticket
 * describing any current issues with the test
 *
 * @param {String} execId - The execution ID of the Zephyr test
 * @param {String} status - Numerical value representing the status of the test
 * @param {Array[String]} comment - Array containing the comments for the test
 ******************************************************************************/
function updateTicket(execId, status, comment) {
	return new Promise((resolve, reject) => {
		const data = {
			url: `https://jira.appcelerator.org/rest/zapi/latest/execution/${execId}/execute`,
			body: `{"status":"${status}", "comment":"${comment.length} Test Step(s) Failing\\n\\n${comment.join('\\n\\n')}"}`,
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Basic ${encodedComb}`
			}
		};

		makeRequest(data)
			.then(() => resolve())
			.catch(err => reject(err));
	});
}

/*******************************************************************************
 * Get the IDs of all images currently attatched to the Zephyr test execution
 *
 * @param {String} execId - The execution ID of the Zephyr test
 ******************************************************************************/
function getImages(execId) {
	return new Promise((resolve, reject) => {
		const data = {
			url: `https://jira.appcelerator.org/rest/zapi/latest/attachment/attachmentsByEntity?entityId=${execId}&entityType=execution`,
			body: '{}',
			method: 'GET',
			headers: {
				'X-Atlassian-Token': 'nocheck',
				'Content-Type': 'application/json',
				Authorization: `Basic ${encodedComb}`
			}
		};

		makeRequest(data)
			.then(response => {
				let imageIds = [];

				response.data.forEach(image => {
					imageIds.push(image.fileId);
				});

				resolve(imageIds);
			})
			.catch(err => reject(err));
	});
}

/*******************************************************************************
 * Delete any images currently attatched to the ticket, this way if the test was
 * a fail, then only new screenshots will be present, and if it changes to a
 * pass then we don't want old screenshots lingering
 *
 * @param {Array[String]} imageIds - List of IDs for images currently attatched
 ******************************************************************************/
function deleteImages(imageIds) {
	return new Promise((resolve, reject) => {
		let p = Promise.resolve();

		imageIds.forEach(imageId => {
			const data = {
				url: `https://jira.appcelerator.org/rest/zapi/latest/attachment/${imageId}`,
				body: '{}',
				method: 'DELETE',
				headers: {
					'X-Atlassian-Token': 'nocheck',
					'Content-Type': 'application/json',
					Authorization: `Basic ${encodedComb}`
				}
			};

			p = p
				.then(() => makeRequest(data))
				.catch(err => reject(err));
		});

		p.then(() => resolve());
	});
}

/*******************************************************************************
 * Upload the images found in the failure folder, and the originals from the
 * reference folder, and attatch them to the Zephyr test execution for the test
 *
 * @param {String} moduleName - The module being tested
 * @param {String} execId - The execution ID of the Zephyr test
 * @param {String} ticket - The name of the ticket that is being updated
 * @param {String} platform - The OS being run on
 ******************************************************************************/
function uploadImages(moduleName, execId, ticket, platform) {
	return new Promise((resolve, reject) => {
		const
			failPath = path.join(global.projRoot, 'Logs', global.timestamp, 'Screen_Shots'),
			refPath = path.join(global.projRoot, 'Modules', moduleName, 'Screen_Shots');

		let
			images = [],
			files = fs.readdirSync(failPath);

		files.forEach(file => {
			if (file.includes(`${ticket}_${platform}`)) {
				const
					fail = path.join(failPath, file),
					ref = path.join(refPath, file.replace('_Failure', ''));

				const
					refExists = fs.existsSync(ref),
					failExists = fs.existsSync(fail);

				// Check that they both exist, had some nasty errors around this
				if (refExists && failExists) {
					images.push(ref);
					images.push(fail);
				}
			}
		});

		let p = Promise.resolve();

		images.forEach(image => {
			const data = {
				url: `https://jira.appcelerator.org/rest/zapi/latest/attachment?entityId=${execId}&entityType=execution`,
				method: 'POST',
				formData: {
					file: fs.createReadStream(image)
				},
				headers: {
					'X-Atlassian-Token': 'nocheck',
					'Content-Type': 'application/json',
					Authorization: `Basic ${encodedComb}`
				}
			};

			p = p
				.then(() => makeRequest(data))
				.catch(err => reject(err));
		});

		p.then(() => resolve());
	});
}

/*******************************************************************************
 * Use the project key to find the ID value for the project
 *
 * @param {String} projectKey - The name of the project
 ******************************************************************************/
function getProject(projectKey) {
	return new Promise((resolve, reject) => {
		const data = {
			url: `https://jira.appcelerator.org/rest/api/latest/project/${projectKey}`,
			body: '{}',
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Basic ${encodedComb}`
			}
		};

		makeRequest(data)
			.then(response => {
				try {
					resolve(response.id);
				} catch (err) {
					reject(new Error(`Cannot Find a Project Matching "${projectKey}"`));
				}
			})
			.catch(err => reject(err));
	});
}

/*******************************************************************************
 * Use the ID of the project, and the release version number to finr the ID
 * value of the release
 *
 * @param {String} projectId - The ID for the project
 * @param {String} release - The version number for the release
 ******************************************************************************/
function getRelease(projectId, release) {
	return new Promise((resolve, reject) => {
		const data = {
			url: `https://jira.appcelerator.org/rest/api/latest/project/${projectId}/versions`,
			body: '{}',
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Basic ${encodedComb}`
			}
		};

		makeRequest(data)
			.then(response => {
				for (let i = 0; i < response.length; i++) {
					if (response[i].name === release) {
						resolve(response[i].id);
					}
					if (i === (response.length - 1)) {
						reject(new Error(`Cannot find a release matching ${release}`));
					}
				}
			})
			.catch(err => reject(err));
	});
}

/*******************************************************************************
 * Use the IDs of the project and release, as well as the cycle name to find
 * the ID value of the cycle, that can then be used to update the test
 * executions
 *
 * @param {String} projectId - The ID for the project
 * @param {String} releaseId - The ID for the release
 * @param {String} cycleName - The name of the Zephyr test cycle
 ******************************************************************************/
function getCycle(projectId, releaseId, cycleName) {
	return new Promise((resolve, reject) => {
		const data = {
			url: `https://jira.appcelerator.org/rest/zapi/latest/cycle?projectId=${projectId}&versionId=${releaseId}`,
			body: '{}',
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Basic ${encodedComb}`
			}
		};

		makeRequest(data)
			.then(response => {
				Object.keys(response).forEach(key => {
					let name = (response[key].name);
					// Resolve if we've found the key we're looking for
					if (name === cycleName) {
						resolve(key);
					}

					// We've reached the end of the list, reject with error
					if (key === 'recordsCount') {
						reject(new Error(`Didn't Find a Test Cycle Matching "${cycleName}"`));
					}
				});
			})
			.catch(err => reject(err));
	});
}

/*******************************************************************************
 * Make a HTTP request with the given resources.
 *
 * @param {Object} data - The particulars for the request
 ******************************************************************************/
function makeRequest(data) {
	return new Promise((resolve, reject) => {
		request(data, (err, response, body) => {
			if (err) {
				reject(err);
			} else {
				try {
					resolve(JSON.parse(body));
				} catch (catchErr) {
					Output.debug(body, 'debug');
					Output.debug(catchErr, 'debug');
					reject(new Error('Issue in JSON Parsing, Dumping Request Body to Log'));
				}
			}
		});
	});
}
