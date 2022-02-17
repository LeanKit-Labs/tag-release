#!/usr/bin/env node
const commander = require("commander");
const api = require("../src/index.js");
const workflow = require("../src/workflows/pre-release");
const utils = require("../src/utils.js");

utils.applyCommanderOptions(commander);

commander.parse(process.argv);

let options = {};
const { maxbuffer, verbose } = commander.opts();
const { args } = commander;
const prerelease = args.length ? args[0] : true;
options = { prerelease, verbose, maxbuffer, workflow, command: "prerelease" };

api.cli(options);
