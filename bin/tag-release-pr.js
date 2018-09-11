#!/usr/bin/env node
const commander = require("commander");
const api = require("../src/index.js");
const {
	prWorkflow: workflow,
	prRebaseSuccess,
	prRebaseConflict
} = require("../src/workflows/pr");
const utils = require("../src/utils.js");
const filterFlowBasedOnDevelopBranch = require("../src/helpers/filterFlowBasedOnDevelopBranch");
const runWorkflow = require("../src/helpers/runWorkflow");

utils.applyCommanderOptions(commander);

commander.parse(process.argv);

const callback = options => {
	options.callback = () => console.log("Finished"); // eslint-disable-line no-console
	let flow;
	if (options.conflict) {
		flow = filterFlowBasedOnDevelopBranch(options, prRebaseConflict);

		return runWorkflow(flow, options);
	}

	flow = filterFlowBasedOnDevelopBranch(options, prRebaseSuccess);

	return runWorkflow(flow, options);
};

let options = {};
const { verbose, maxbuffer, args } = commander;
const pr = args.length ? args[0] : true;
options = { pr, verbose, maxbuffer, callback, workflow, command: "pr" };

api.cli(options);
