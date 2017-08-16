import * as run from "./steps";

export default [
	run.gitFetchUpstream,
	run.getReposFromBumpCommit
];

export const qaDefault = [
	run.checkHasDevelopBranch,
	run.gitCheckoutDevelop,
	run.gitRebaseUpstreamDevelop,
	run.getPackageScope,
	run.askReposToUpdate,
	run.verifyPackagesToPromote,
	run.getCurrentDependencyVersions,
	run.askChangeReason,
	run.githubUpstream,
	run.askVersions,
	run.askChangeType,
	run.promptBranchName,
	run.gitCheckoutAndCreateBranch,
	run.getFeatureBranch,
	run.updateDependencies,
	run.gitDiff,
	run.gitAdd,
	run.gitCommitBumpMessage,
	run.gitPushUpstreamFeatureBranch
];

export const qaUpdate = [
	run.getPackageScope,
	run.getFeatureBranch,
	run.abortIfDevelopOrMaster,
	run.getCurrentDependencyVersions,
	run.githubUpstream,
	run.askVersions,
	run.updateDependencies,
	run.gitDiff,
	run.gitAdd,
	run.gitAmendCommitBumpMessage,
	run.gitForcePushUpstreamFeatureBranch
];
