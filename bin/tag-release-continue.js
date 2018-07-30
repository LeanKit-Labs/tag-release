#!/usr/bin/env node
const commander = require("commander");
const api = require("../src/index.js");
const workflow = require("../src/workflows/continue");
const { promoteContinue } = require("../src/workflows/promote");
const { prContinue } = require("../src/workflows/pr");
const sequence = require("when/sequence");
const utils = require("../src/utils.js");
const filterFlowBasedOnDevelopBranch = require("../src/helpers/filterFlowBasedOnDevelopBranch");
const getCurrentBranch = require("../src/helpers/getCurrentBranch");

utils.applyCommanderOptions(commander);

commander.parse(process.argv);

const callback = async options => {
	let flow;
	// Get into a weird rebase state where it thinks
	// the current branch is `HEAD`, so we need to reset it.
	options.branch = await getCurrentBranch();
	options.workingBranch = options.branch;

	if (options.branch.includes("promote-release")) {
		flow = filterFlowBasedOnDevelopBranch(options, promoteContinue);

		return sequence(flow, options).then(
			() => console.log("Finished") // eslint-disable-line no-console
		);
	}

	flow = filterFlowBasedOnDevelopBranch(options, prContinue);

	return sequence(flow, options).then(
		() => console.log("Finished") // eslint-disable-line no-console
	);
};

const { verbose, maxbuffer } = commander;
const options = { continue: true, verbose, maxbuffer, callback, workflow };

api.cli(options);
