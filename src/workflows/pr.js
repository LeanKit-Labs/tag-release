import * as run from "./steps";

export default [
	run.gitFetchUpstream,
	run.getPackageScope,
	run.getFeatureBranch,
	run.gitRebaseUpstreamBranch,
	run.saveState,
	run.gitRebaseUpstreamDevelop,
	run.getReposFromBumpCommit,
	run.verifyPackagesToPromote,
	run.getCurrentDependencyVersions,
	run.githubUpstream,
	run.askVersions,
	run.updateDependencies,
	run.gitDiff,
	run.gitAdd,
	run.gitAmendCommitBumpMessage,
	run.gitForcePushUpstreamFeatureBranch,
	run.githubUpstream,
	run.createGithubPullRequestAganistDevelop,
	run.cleanUpTmpFiles
];

export const keepTheBallRolling = [
	run.getPackageScope,
	run.getReposFromBumpCommit,
	run.verifyPackagesToPromote,
	run.getCurrentDependencyVersions,
	run.githubUpstream,
	run.askVersions,
	run.updateDependencies,
	run.gitDiff,
	run.gitAdd,
	run.gitAmendCommitBumpMessage,
	run.gitForcePushUpstreamFeatureBranch,
	run.githubUpstream,
	run.createGithubPullRequestAganistDevelop,
	run.cleanUpTmpFiles
];
