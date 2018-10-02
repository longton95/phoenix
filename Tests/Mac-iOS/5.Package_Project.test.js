'use strict';

const
	Appc = require('../../Helpers/Appc_Helper.js'),
	MochaFilter = require('mocha-filter')(global.filters);

describe('Package App (appstore)', () => {
	it('Package the Application', async () => {
		await Appc.packageApp('appstore');
	});
});
