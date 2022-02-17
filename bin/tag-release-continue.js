#!/usr/bin/env node
const commander = require("commander");
const api = require("../src/index.js");
const workflow = require("../src/workflows/continue");
const { promoteContinue } = require("../src/workflows/promote");
const { prContinue } = require("../src/workflows/pr");
const utils = require("../src/utils.js");
const filterFlowBasedOnDevelopBranch = require("../src/helpers/filterFlowBasedOnDevelopBranch");
const getCurrentBranch = require("../src/helpers/getCurrentBranch");
const runWorkflow = require("../src/helpers/runWorkflow");
const { runPostScript } = require("../src/workflows/steps/index.js");

utils.applyCommanderOptions(commander);

commander.parse(process.argv);

const callback = async options => {
	options.callback = () => console.log("Finished"); // eslint-disable-line no-console
	let flow;
	// Get into a weird rebase state where it thinks
	// the current branch is `HEAD`, so we need to reset it.
	options.branch = await getCurrentBranch();
	options.workingBranch = options.branch;

	if (options.branch.includes("promote-release")) {
		flow = filterFlowBasedOnDevelopBranch(options, promoteContinue);

		options.scripts = utils.getScripts("promote");
		options.command = "promote";
		if (options.scripts.postpromote) {
			flow.push(runPostScript);
		}
		return runWorkflow(flow, options);
	}

	flow = filterFlowBasedOnDevelopBranch(options, prContinue);

	options.scripts = utils.getScripts("pr");
	options.command = "pr";
	if (options.scripts.postpr) {
		flow.push(runPostScript);
	}
	return runWorkflow(flow, options);
};

const { maxbuffer, verbose } = commander.opts();
const options = {
	continue: true,
	verbose,
	maxbuffer,
	callback,
	workflow,
	command: "continue"
};

api.cli(options);
