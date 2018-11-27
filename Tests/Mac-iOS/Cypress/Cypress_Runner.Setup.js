const
	path = require('path'),
	cypress = require('cypress'),
	app = require('../../../Config/Test_Config.js').app;

const
	filePath = path.join(__dirname, '..', '..', '..', 'Build', 'Mac-iOS', 'App', app.name, 'tiapp.xml'),
	tiapp = require('tiapp.xml').load(filePath);

cypress.run({
	reporter: 'spec',
	browser: 'electron',
	config: {
		// Point to where our tests are
		integrationFolder: __dirname,
		// Give a test timeout value
		defaultCommandTimeout: 60000,
		// Deny all that extra stuff
		fixturesFolder: false,
		supportFile: false,
		pluginsFile: false,
		video: false,
		// Set the window size
		viewportHeight: 1080,
		viewportWidth: 1920
	},
	env: {
		APPLEUSER: process.env.APPLEUSER,
		APPLEPASS: process.env.APPLEPASS,
		APPVERSION: tiapp.version,
		APPNAME: app.name
	}
});
