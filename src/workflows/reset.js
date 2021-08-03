const run = require("./steps/index");

module.exports = [
	run.verifyRemotes,
	run.verifyOrigin,
	run.githubOrigin,
	run.verifyUpstream,
	run.fetchUpstream,
	run.gitStash,
	run.verifyDefaultBranch,
	run.checkoutDefaultBranch,
	run.gitResetDefaultBranch,
	run.gitRemovePromotionBranches,
	run.verifyDevelopBranch,
	run.checkoutDevelop,
	run.gitResetDevelop,
	run.verifyPackageJson,
	run.verifyChangelog,
	run.cleanUpTmpFiles,
	run.resetIfStashed
];
