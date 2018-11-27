'use strict';

const
	path = require('path'),
	assert = require('assert'),
	exec = require('child_process').execSync,
	Appc = require('../../Helpers/Appc_Helper.js'),
	MochaFilter = require('mocha-filter')(global.filters);

describe('Package App (App Store)', () => {
	after('Kill the Xcode process', async () => {
		exec('pkill Xcode');
	});

	it('Package the Application', async () => {
		await Appc.packageApp('appstore');
	});

	it('Use Xcode to Upload the app to the Appstore', async function () {
		this.timeout(420000);
		this.slow(400000);

		const script = path.join(global.projRoot, 'Tests', 'Mac-iOS', 'OSAScript', 'Upload_App.scpt');

		exec(`osascript ${script}`, {
			stdio: [ 0 ]
		});
	});

	it('Login to the Apple Developer Website, and Publish the application', function () {
		this.timeout(600000);
		this.slow(400000);

		let runner = path.join(global.projRoot, 'Tests', 'Mac-iOS', 'Cypress', 'Cypress_Runner.Setup.js');

		let child = exec(`node ${runner}`);

		assert(child.toString().includes('All specs passed!'), true);
	});
});
