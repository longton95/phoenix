'use strict';

const
	assert = require('assert'),
	Appc = require('../../Helpers/Appc_Helper.js'),
	MochaFilter = require('mocha-filter')(global.filters);

describe('Generate Module', () => {
	it('Generate a New Module', async () => {
		await Appc.newModule();

		assert(Appc.checkGeneratedModule(), true);
	});
});
