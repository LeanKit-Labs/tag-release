const run = require("./steps");

module.exports = {
	rebaseUpdateLogCommitTagRelease: [
		run.getCurrentBranchVersion,
		run.checkHasDevelopBranch,
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
		run.gitPushUpstreamMaster,
		run.npmPublish,
		run.gitCheckoutDevelop,
		run.gitMergeMaster,
		run.gitPushUpstreamDevelop,
		run.gitPushOriginMaster,
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
		run.createGithubPullRequestAganistDevelop,
		run.cleanUpTmpFiles
	]
};
