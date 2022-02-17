#!/usr/bin/env node
const commander = require("commander");
const api = require("../src/index.js");
const workflow = require("../src/workflows/dev");
const utils = require("../src/utils.js");

utils.applyCommanderOptions(commander);

commander.parse(process.argv);

const { maxbuffer, verbose } = commander.opts();
const { args } = commander;
const devBranch = args.length ? args[0].trim() : undefined;
const options = {
	devBranch,
	dev: true,
	verbose,
	maxbuffer,
	workflow,
	command: "dev"
};

api.cli(options);
