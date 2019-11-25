const {
	checkHasDevelopBranch,
	runPreScript,
	runPostScript
} = require("../workflows/steps/index.js");
const getCurrentBranch = require("./getCurrentBranch");
const filterFlowBasedOnDevelopBranch = require("./filterFlowBasedOnDevelopBranch");
const utils = require("../utils");

const setup = async options => {
	if (!options.callback) {
		/* istanbul ignore next */
		options.callback = () => console.log("Finished"); // eslint-disable-line no-console
	}
	options.configPath = options.config || "./package.json";
	options.version = await utils.getCurrentVersion();

	options.branch = options.branch ? options.branch : await getCurrentBranch();
	options.workingBranch = options.branch;

	await checkHasDevelopBranch(options);

	options.workflow = filterFlowBasedOnDevelopBranch(
		options,
		options.workflow
	);

	options.scripts = await utils.getScripts(options.command);
	if (options.scripts[`pre${options.command}`]) {
		options.workflow.unshift(runPreScript);
	}
	if (options.scripts[`post${options.command}`]) {
		options.workflow.push(runPostScript);
	}

	if (!utils.fileExists(options.configPath) && options.command !== "l10n") {
		utils.advise("updateVersion");
	}

	return Promise.resolve(options);
};

module.exports = setup;
