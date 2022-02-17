#!/usr/bin/env node
const commander = require("commander");
const api = require("../src/index.js");
const { promoteWorkflow: workflow } = require("../src/workflows/promote");
const utils = require("../src/utils.js");

utils.applyCommanderOptions(commander);

commander.parse(process.argv);

let options = {};
const { maxbuffer, verbose } = commander.opts();
const { args } = commander;
const promote = args.length ? args[0] : true;
options = { promote, verbose, maxbuffer, workflow, command: "promote" };

api.cli(options);
