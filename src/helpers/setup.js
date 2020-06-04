const {
	checkHasDevelopBranch,
	runPreScript,
	runPostScript
} = require("../workflows/steps/index.js");
const getCurrentBranch = require("./getCurrentBranch");
const getRootDirectory = require("./getRootDirectory");
const filterFlowBasedOnDevelopBranch = require("./filterFlowBasedOnDevelopBranch");
const utils = require("../utils");

const setup = async options => {
	const rootDir = await getRootDirectory();
	const configPath = options.config || "package.json";
	options.filePaths = {
		rootPath: rootDir,
		configPath: `${rootDir}/${configPath}`,
		changeLogPath: `${rootDir}/CHANGELOG.md`,
		packageLockJsonPath: `${rootDir}/package-lock.json`,
		gitIgnorePath: `${rootDir}/.gitignore`,
		pullRequestTemplatePath: `${rootDir}/.github/PULL_REQUEST_TEMPLATE.md`
	};

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

	if (
		!utils.fileExists(options.filePaths.configPath) &&
		options.command !== "l10n"
	) {
		utils.advise("updateVersion");
	}

	return Promise.resolve(options);
};

module.exports = setup;
