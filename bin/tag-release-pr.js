#!/usr/bin/env node
const commander = require("commander");
const { extend } = require("lodash");
const api = require("../src/index.js");
const {
	prWorkflow: workflow,
	prRebaseSuccess,
	prRebaseConflict
} = require("../src/workflows/pr");
const sequence = require("when/sequence");
const utils = require("../src/utils.js");

utils.applyCommanderOptions(commander);

commander.parse(process.argv);

const callback = options => {
	if (options.conflict) {
		return sequence(prRebaseConflict, options).then(
			() => console.log("Finished") // eslint-disable-line no-console
		);
	}

	return sequence(prRebaseSuccess, options).then(
		() => console.log("Finished") // eslint-disable-line no-console
	);
};

let options = {};
const { verbose, maxbuffer, args } = commander;
const pr = args.length ? args[0] : true;
options = extend({}, { pr, verbose, maxbuffer, callback, workflow });

api.cli(options);
