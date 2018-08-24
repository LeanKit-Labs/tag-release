const run = require("./steps/index");

module.exports = [
	run.verifyRemotes,
	run.verifyOrigin,
	run.githubOrigin,
	run.verifyUpstream,
	run.fetchUpstream,
	run.checkForUncommittedChanges,
	run.stashIfUncommittedChangesExist,
	run.verifyMasterBranch,
	run.checkoutMaster,
	run.gitResetMaster,
	run.gitRemovePromotionBranches,
	run.verifyDevelopBranch,
	run.checkoutDevelop,
	run.gitResetDevelop,
	run.verifyPackageJson,
	run.verifyChangelog,
	run.cleanUpTmpFiles
];
