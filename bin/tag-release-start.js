#!/usr/bin/env node
const commander = require("commander");
const { extend } = require("lodash");
const api = require("../src/index.js");
const workflow = require("../src/workflows/default");
const utils = require("../src/utils.js");

utils.applyCommanderOptions(commander);

commander.parse(process.argv);

const { verbose, maxbuffer } = commander;
const options = extend({}, { verbose, maxbuffer, workflow });

api.cli(options);
