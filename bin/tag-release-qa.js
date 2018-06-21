#!/usr/bin/env node
const commander = require("commander");
const { extend } = require("lodash");
const api = require("../src/index.js");
const {
	qaWorkflow: workflow,
	qaDefault,
	qaUpdate
} = require("../src/workflows/qa");
const sequence = require("when/sequence");
const utils = require("../src/utils.js");

utils.applyCommanderOptions(commander);

commander.parse(process.argv);

const callback = options => {
	const onFeatureBranch =
		options.branch !== "develop" && options.branch !== "master";
	if (options.packages.length && onFeatureBranch) {
		return sequence(qaUpdate, options).then(
			() => console.log("Finished") // eslint-disable-line no-console
		);
	}

	return sequence(qaDefault, options).then(
		() => console.log("Finished") // eslint-disable-line no-console
	);
};

let options = {};
const { verbose, maxbuffer, args } = commander;
const qa = args.length ? args[0] : true;
options = extend({}, { qa, verbose, maxbuffer, callback, workflow });

api.cli(options);
