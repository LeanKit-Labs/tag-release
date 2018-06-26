#!/usr/bin/env node
const commander = require("commander");
const { extend } = require("lodash");
const api = require("../src/index.js");
const { promoteWorkflow: workflow } = require("../src/workflows/promote");
const utils = require("../src/utils.js");

utils.applyCommanderOptions(commander);

commander.parse(process.argv);

let options = {};
const { verbose, maxbuffer, args } = commander;
const promote = args.length ? args[0] : true;
options = extend({}, { promote, verbose, maxbuffer, workflow });

api.cli(options);
