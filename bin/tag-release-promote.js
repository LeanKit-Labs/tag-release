#!/usr/bin/env node
const commander = require("commander");
const { extend } = require("lodash");
const api = require("../src/index.js");
const { promoteWorkflow: workflow } = require("../src/workflows/promote");

commander
	.option("--verbose", "Console additional information")
	.option(
		"--maxbuffer <n>",
		"Overrides the max stdout buffer of the child process. Size is 1024 * <n>.",
		parseInt
	)
	.parse(process.argv);

let options = {};
const { verbose, maxbuffer, args } = commander;
const promote = args.length ? args[0] : true;
options = extend({}, { promote, verbose, maxbuffer, workflow });

api.cli(options);
