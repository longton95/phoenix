'use strict';

const
	assert = require('assert'),
	Appc = require('../../Helpers/Appc_Helper.js'),
	MochaFilter = require('mocha-filter')(global.filters);

describe('Build App For Simulator', () => {
	it('Build the Application', async () => {
		await Appc.buildApp('simulator');

		assert.equal(Appc.checkBuiltApp('simulator'), true);
	});
});
