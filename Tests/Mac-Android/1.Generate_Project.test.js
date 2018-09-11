'use strict';

const
	assert = require('assert'),
	Appc = require('../../Helpers/Appc_Helper.js'),
	MochaFilter = require('mocha-filter')(global.filters);

describe('Generate Project', () => {
	it('Generate a New Project', async () => {
		await Appc.newProject();

		assert(Appc.checkGenerated(), true);
	});
});
