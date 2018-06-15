#!/usr/bin/env node
const commander = require("commander");
const { extend } = require("lodash");
const api = require("../src/index.js");
const workflow = require("../src/workflows/default");

commander
	.option("--verbose", "Console additional information")
	.option(
		"--maxbuffer <n>",
		"Overrides the max stdout buffer of the child process. Size is 1024 * <n>.",
		parseInt
	)
	.option(
		"-r, --release [type]",
		"Release type (major, minor, patch, premajor, preminor, prepatch, prerelease)",
		/^(major|minor|patch|premajor|preminor|prepatch|prerelease)/i
	)
	.parse(process.argv);

const { verbose, maxbuffer, release } = commander;
const options = extend({}, { verbose, maxbuffer, release, workflow });

api.run(options);
