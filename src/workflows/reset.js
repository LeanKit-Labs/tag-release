import * as run from "./steps";

export default [
	run.gitFetchUpstreamMaster,
	run.checkHasDevelopBranch,
	run.checkForUncommittedChanges,
	run.stashIfUncommittedChangesExist,
	run.verifyMasterBranch,
	run.gitCheckoutMaster,
	run.gitResetMaster,
	run.gitRemovePromotionBranches,
	run.verifyDevelopBranch,
	run.gitCheckoutDevelop,
	run.gitResetDevelop
];
