#!/usr/bin/env node
const commander = require("commander");
const { extend } = require("lodash");
const api = require("../src/index.js");
const workflow = require("../src/workflows/pre-release");

commander
	.option("-i, --identifier <identifier>", "Identifier used for pre-release")
	.option("--verbose", "Console additional information")
	.option(
		"--maxbuffer <n>",
		"Overrides the max stdout buffer of the child process. Size is 1024 * <n>.",
		parseInt
	)
	.parse(process.argv);

const { identifier, verbose, maxbuffer } = commander;
const options = extend(
	{},
	{ prerelease: true, identifier, verbose, maxbuffer, workflow }
);

api.run(options);
