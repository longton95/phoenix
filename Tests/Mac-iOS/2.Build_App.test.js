'use strict';

const
	assert = require('assert'),
	Appc = require('../../Helpers/Appc_Helper.js'),
	MochaFilter = require('mocha-filter')(global.filters);

describe('Build App', () => {
	it('Build the Application', async () => {
		await Appc.buildApp();

		assert.equal(Appc.checkBuilt(), true);
	});
});
