import * as run from "./steps/index";

export default [
	run.verifyRemotes,
	run.verifyOrigin,
	run.githubOrigin,
	run.verifyUpstream,
	run.gitFetchUpstream,
	run.checkHasDevelopBranch,
	run.checkForUncommittedChanges,
	run.stashIfUncommittedChangesExist,
	run.verifyMasterBranch,
	run.gitCheckoutMaster,
	run.gitResetMaster,
	run.gitRemovePromotionBranches,
	run.verifyDevelopBranch,
	run.gitCheckoutDevelop,
	run.gitResetDevelop,
	run.verifyPackageJson,
	run.verifyChangelog,
	run.cleanUpTmpFiles
];
