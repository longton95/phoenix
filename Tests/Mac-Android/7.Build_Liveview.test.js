'use strict';

const
	Appc = require('../../Helpers/Appc_Helper.js'),
	MochaFilter = require('mocha-filter')(global.filters);

describe('Build Liveview', () => {
	it('Build the App with Liveview', async () => {
		await Appc.buildLiveviewApp();
	});
});
