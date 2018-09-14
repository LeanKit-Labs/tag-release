#!/usr/bin/env node
const commander = require("commander");
const api = require("../src/index.js");
const workflow = require("../src/workflows/dev");
const utils = require("../src/utils.js");

utils.applyCommanderOptions(commander);

commander.parse(process.argv);

const { verbose, maxbuffer } = commander;
const options = { dev: true, verbose, maxbuffer, workflow, command: "dev" };

api.cli(options);
