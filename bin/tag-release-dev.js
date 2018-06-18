#!/usr/bin/env node
const commander = require("commander");
const { extend } = require("lodash");
const api = require("../src/index.js");
const workflow = require("../src/workflows/dev");

commander
	.option("--verbose", "Console additional information")
	.option(
		"--maxbuffer <n>",
		"Overrides the max stdout buffer of the child process. Size is 1024 * <n>.",
		parseInt
	)
	.parse(process.argv);

const { verbose, maxbuffer } = commander;
const options = extend({}, { dev: true, verbose, maxbuffer, workflow });

api.cli(options);
