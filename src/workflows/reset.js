import * as run from "./steps/index";

export default [
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
	run.cleanUpTmpFiles
];
