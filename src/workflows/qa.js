import * as run from "./steps";

export default [
	run.gitFetchUpstream,
	run.checkHasDevelopBranch,
	run.gitCheckoutDevelop,
	run.gitRebaseUpstreamDevelop,
	run.getPackageScope,
	run.askReposToUpdate,
	run.verifyPackagesToPromote,
	run.getCurrentDependencyVersions,
	run.promptQANextReleaseUpdate,
	run.askChangeReason,
	run.askVersions,
	run.askChangeType,
	run.promptBranchName,
	run.gitCheckoutAndCreateBranch,
	run.getFeatureBranch,
	run.updateDependencies,
	run.gitDiff,
	run.gitCreateUpstreamBranch,
	run.gitAdd,
	run.gitCommitBumpMessage,
	run.gitPushUpstreamFeatureBranch
];
