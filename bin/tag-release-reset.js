#!/usr/bin/env node
const commander = require("commander");
const api = require("../src/index.js");
const workflow = require("../src/workflows/reset");

commander.parse(process.argv);

const options = { reset: true, workflow, command: "reset" };

api.cli(options);
