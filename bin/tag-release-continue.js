#!/usr/bin/env node
const commander = require("commander");
const api = require("../src/index.js");
const workflow = require("../src/workflows/continue");
const { promoteContinue } = require("../src/workflows/promote");
const { prContinue } = require("../src/workflows/pr");
const sequence = require("when/sequence");
const utils = require("../src/utils.js");

utils.applyCommanderOptions(commander);

commander.parse(process.argv);

const callback = options => {
	if (options.branch.includes("promote-release")) {
		return sequence(promoteContinue, options).then(
			() => console.log("Finished") // eslint-disable-line no-console
		);
	}

	return sequence(prContinue, options).then(
		() => console.log("Finished") // eslint-disable-line no-console
	);
};

const { verbose, maxbuffer } = commander;
const options = { continue: true, verbose, maxbuffer, callback, workflow };

api.cli(options);
