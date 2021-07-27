const run = require("./steps");

module.exports = {
	rebaseUpdateLogCommitTagRelease: [
		run.getCurrentBranchVersion,
		run.gitMergeUpstreamDevelop,
		run.gitShortLog,
		run.previewLog,
		run.askSemverJump,
		run.updateLog,
		run.updateVersion,
		run.updateChangelog,
		run.updatePackageLockJson,
		run.gitDiff,
		run.gitAdd,
		run.gitCommit,
		run.gitTag,
		run.gitPushUpstreamDefaultBranch,
		run.npmPublish,
		run.checkoutDevelop,
		run.gitMergeDevelopWithDefaultBranch,
		run.gitPushUpstreamDevelop,
		run.gitPushOriginDefaultBranch,
		run.githubUpstream,
		run.githubRelease
	],
	createPullRequest: [
		run.getDependenciesFromFile,
		run.githubUpstream,
		run.askVersions,
		run.updateDependencies,
		run.updatePackageLockJson,
		run.gitDiff,
		run.gitAdd,
		run.gitAmendCommitBumpMessage,
		run.gitForcePushUpstreamFeatureBranch,
		run.githubUpstream,
		run.createGithubPullRequestAganistBase,
		run.cleanUpTmpFiles
	]
};
