#!/usr/bin/env node
const commander = require("commander");
const { extend } = require("lodash");
const api = require("../src/index.js");
const workflow = require("../src/workflows/pre-release");
const utils = require("../src/utils.js");

utils.applyCommanderOptions(commander);

commander.parse(process.argv);

let options = {};
const { verbose, maxbuffer, args } = commander;
const prerelease = args.length ? args[0] : true;
options = extend({}, { prerelease, verbose, maxbuffer, workflow });

api.cli(options);
