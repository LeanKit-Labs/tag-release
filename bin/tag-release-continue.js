#!/usr/bin/env node
const commander = require("commander");
const { extend } = require("lodash");
const api = require("../src/index.js");
const workflow = require("./workflows/continue");
const { promoteContinue } = require("./workflows/promote");
const { prContinue } = require("./workflows/pr");
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
	if (options.branch.includes("promote-release")) {
		return sequence(promoteContinue, options).then(
			() => console.log("Finished") // eslint-disable-line no-console
		);
	}

	return sequence(prContinue, options).then(
		() => console.log("Finished") // eslint-disable-line no-console
	);
};

let options = {};
const { verbose, maxbuffer } = commander;
options = extend(
	{},
	{ continue: true, verbose, maxbuffer, callback, workflow }
);

api.cli(options);
