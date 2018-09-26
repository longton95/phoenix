'use strict';

const
	assert = require('assert'),
	Appc = require('../../Helpers/Appc_Helper.js'),
	MochaFilter = require('mocha-filter')(global.filters);

describe('Build Module', () => {
	it('Build the Module', async () => {
		await Appc.buildModule();

		assert.equal(Appc.checkBuiltModule(), true);
	});
});
