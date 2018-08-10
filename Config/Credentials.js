'use strict';

// Used in the Zephyr helper for publishing results to JIRA
// NOTE: These should be credentials for the Appcelerator
//       JIRA instance and not the Axway JIRA
exports.jira = {
	username: process.env.JIRAUSER,
	password: process.env.JIRAPASS
};
