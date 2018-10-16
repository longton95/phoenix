'use strict';

const
	assert = require('assert'),
	Appc = require('../../Helpers/Appc_Helper.js'),
	MochaFilter = require('mocha-filter')(global.filters);

describe('Package App (AdHoc)', () => {
	it('Package the Application', async () => {
		await Appc.packageApp('adhoc');

		assert.equal(Appc.checkPackagedApp(), true);
	});
});
