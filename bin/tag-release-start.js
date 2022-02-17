#!/usr/bin/env node
const commander = require("commander");
const api = require("../src/index.js");
const workflow = require("../src/workflows/default");
const utils = require("../src/utils.js");

utils.applyCommanderOptions(commander);

commander.parse(process.argv);

const { maxbuffer, verbose } = commander.opts();
const options = { verbose, maxbuffer, workflow, command: "start" };

api.cli(options);
