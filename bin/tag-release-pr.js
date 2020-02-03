#!/usr/bin/env node
const commander = require("commander");
const api = require("../src/index.js");
const {
	prWorkflow: workflow,
	prNoBump,
	prRebaseSuccess,
	prRebaseConflict
} = require("../src/workflows/pr");
const utils = require("../src/utils.js");
const filterFlowBasedOnDevelopBranch = require("../src/helpers/filterFlowBasedOnDevelopBranch");
const runWorkflow = require("../src/helpers/runWorkflow");

utils.applyCommanderOptions(commander);

commander.option("--no-bump", "used to pr branch without packages to bump");

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
const { verbose, maxbuffer, args, bump } = commander;
const pr = args.length ? args[0] : true;
if (bump) {
	options = {
		pr,
		verbose,
		maxbuffer,
		callback,
		workflow,
		command: "pr",
		bump
	};
} else {
	options = {
		pr,
		verbose,
		maxbuffer,
		workflow: prNoBump,
		command: "pr",
		bump
	};
}

api.cli(options);
