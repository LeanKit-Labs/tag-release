const {
	checkHasDevelopBranch,
	runPreScript,
	runPostScript,
	setFilePaths
} = require("../workflows/steps/index.js");
const getCurrentBranch = require("./getCurrentBranch");
const getDefaultBranch = require("./getDefaultBranch");
const getRepoName = require("./getRepoName");
const filterFlowBasedOnDevelopBranch = require("./filterFlowBasedOnDevelopBranch");
const utils = require("../utils");

const setup = async options => {
	console.log( "hello from setup" );
	await setFilePaths(options);
	options.defaultBranch = await getDefaultBranch();
	if (!options.defaultBranch) {
		utils.advise("defaultBranch");
		return Promise.reject();
	}

	options.repoName = await getRepoName();

	options.version = await utils.getCurrentVersion();

	options.branch = options.branch ? options.branch : await getCurrentBranch();
	options.workingBranch = options.branch;

	await checkHasDevelopBranch(options);

	options.workflow = filterFlowBasedOnDevelopBranch(
		options,
		options.workflow
	);

	options.scripts = utils.getScripts(options.command);
	if (
		options.command !== "continue" &&
		options.scripts[`pre${options.command}`]
	) {
		options.workflow.unshift(runPreScript);
	}

	if (!options.callback) {
		/* istanbul ignore next */
		options.callback = () => console.log("Finished"); // eslint-disable-line no-console
		if (
			options.command !== "continue" &&
			options.scripts[`post${options.command}`]
		) {
			options.workflow.push(runPostScript);
		}
	}

	if (!utils.fileExists(options.filePaths.configPath)) {
		utils.advise("updateVersion");
	}

	return Promise.resolve(options);
};

module.exports = setup;
