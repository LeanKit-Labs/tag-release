import * as run from "./steps";

export default [
	run.gitFetchUpstream,
	run.getPackageScope,
	run.askReposToUpdate,
	run.askVersions,
	run.askChangeType,
	run.askChangeReason,
	run.gitCheckoutBranch,
	run.getFeatureBranch,
	run.updateDependencies,
	run.gitDiff,
	run.gitCreateUpstreamBranch,
	run.gitAdd,
	run.gitCommitBumpMessage,
	run.gitPushUpstreamFeatureBranch
];
