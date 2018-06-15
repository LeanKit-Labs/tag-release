#!/usr/bin/env node
const commander = require("commander");
const { extend } = require("lodash");
const api = require("../src/index.js");
const { qaWorkflow: workflow, qaDefault, qaUpdate } = require("./workflows/qa");
const sequence = require("when/sequence");

commander
	.option("--verbose", "Console additional information")
	.option(
		"--maxbuffer <n>",
		"Overrides the max stdout buffer of the child process. Size is 1024 * <n>.",
		parseInt
	)
	.parse(process.argv);

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

api.run(options);
