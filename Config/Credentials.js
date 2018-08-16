'use strict';

// NOTE: PLEASE DON'T COMMIT SENSETIVE DATA, THIS IS A PUBLIC REPO

// Used in the Zephyr helper for publishing results to JIRA
// NOTE: These should be credentials for the Appcelerator
//       JIRA instance and not the Axway JIRA
exports.jira = {
	username: process.env.JIRAUSER,
	password: process.env.JIRAPASS
};

exports.appc = {
	org: 'qe_test_org_prod_team',
	username: process.env.APPCUSER,
	password: process.env.APPCPASS
};
