import * as run from "./steps";

export const rebaseUpdateLogCommitTagRelease = [
	run.getCurrentBranchVersion,
	run.checkHasDevelopBranch,
	run.gitMergeUpstreamDevelop,
	run.gitShortLog,
	run.previewLog,
	run.askSemverJump,
	run.updateLog,
	run.updateVersion,
	run.updateChangelog,
	run.gitDiff,
	run.updatePackageLockJson,
	run.gitAdd,
	run.gitCommit,
	run.gitTag,
	run.gitPushUpstreamMaster,
	run.npmPublish,
	run.gitCheckoutDevelop,
	run.gitMergeMaster,
	run.gitPushUpstreamDevelop,
	run.gitPushOriginMaster,
	run.githubUpstream,
	run.githubRelease
];

export const createPullRequest = [
	run.getReposFromBumpCommit,
	run.verifyPackagesToPromote,
	run.getCurrentDependencyVersions,
	run.githubUpstream,
	run.askVersions,
	run.updateDependencies,
	run.gitDiff,
	run.updatePackageLockJson,
	run.gitAdd,
	run.gitAmendCommitBumpMessage,
	run.gitForcePushUpstreamFeatureBranch,
	run.githubUpstream,
	run.createGithubPullRequestAganistDevelop,
	run.cleanUpTmpFiles
];
