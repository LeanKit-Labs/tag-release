#!/usr/bin/env node
const commander = require("commander");
const api = require("../src/index.js");
const {
	qaWorkflow: workflow,
	qaDefault,
	qaUpdate
} = require("../src/workflows/qa");
const utils = require("../src/utils.js");
const filterFlowBasedOnDevelopBranch = require("../src/helpers/filterFlowBasedOnDevelopBranch");
const runWorkflow = require("../src/helpers/runWorkflow");

utils.applyCommanderOptions(commander);

commander.parse(process.argv);

const callback = options => {
	options.callback = () => console.log("Finished"); // eslint-disable-line no-console
	const onFeatureBranch =
		options.branch !== "develop" && options.branch !== "master";

	let flow;
	if (options.packages.length && onFeatureBranch) {
		flow = filterFlowBasedOnDevelopBranch(options, qaUpdate);

		return runWorkflow(flow, options);
	}

	flow = filterFlowBasedOnDevelopBranch(options, qaDefault);

	return runWorkflow(flow, options);
};

let options = {};
const { verbose, maxbuffer, args } = commander;
const qa = args.length ? args[0] : true;
options = { qa, verbose, maxbuffer, callback, workflow, command: "qa" };

api.cli(options);
