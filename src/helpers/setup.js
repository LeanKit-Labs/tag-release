const { checkHasDevelopBranch } = require("../workflows/steps/index.js");
const getCurrentBranch = require("./getCurrentBranch");
const filterFlowBasedOnDevelopBranch = require("./filterFlowBasedOnDevelopBranch");
const utils = require("../utils");

const setup = async options => {
	if (!options.callback) {
		/* istanbul ignore next */
		options.callback = () => console.log("Finished"); // eslint-disable-line no-console
	}
	options.version = await utils.getCurrentVersion();

	options.branch = await getCurrentBranch();
	options.workingBranch = options.branch;

	await checkHasDevelopBranch(options);

	options.workflow = filterFlowBasedOnDevelopBranch(
		options,
		options.workflow
	);

	options.configPath = options.config || "./package.json";

	if (!utils.fileExists(options.configPath)) {
		utils.advise("updateVersion");
	}

	return Promise.resolve(options);
};

module.exports = setup;
