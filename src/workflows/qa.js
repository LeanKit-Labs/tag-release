import * as run from "./steps/index";

export default [
	run.gitFetchUpstream,
	run.getFeatureBranch,
	run.getReposFromBumpCommit
];

export const qaDefault = [
	run.checkHasDevelopBranch,
	run.getCurrentBranchVersion,
	run.checkNewCommits,
	run.useCurrentBranchOrCheckoutDevelop,
	run.gitRebaseUpstreamDevelop,
	run.getPackageScope,
	run.askReposToUpdate,
	run.verifyPackagesToPromote,
	run.getCurrentDependencyVersions,
	run.askChangeReason,
	run.githubUpstream,
	run.askVersions,
	run.promptKeepBranchOrCreateNew,
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
	run.getCurrentDependencyVersions,
	run.githubUpstream,
	run.askVersions,
	run.updateDependencies,
	run.gitDiff,
	run.gitAdd,
	run.gitAmendCommitBumpMessage,
	run.gitForcePushUpstreamFeatureBranch
];
