#!/usr/bin/env node
const commander = require("commander");
const { extend } = require("lodash");
const api = require("../src/index.js");
const workflow = require("../src/workflows/reset");

commander.parse(process.argv);

const options = extend({}, { reset: true, workflow });

api.cli(options);
