const run = require("./steps/index");

module.exports = [
	run.isPackagePrivate,
	run.fetchUpstream,
	run.getCurrentBranchVersion,
	run.checkExistingPrereleaseIdentifier,
	run.setPrereleaseIdentifier,
	run.gitMergeUpstreamBranch,
	run.gitShortLog,
	run.previewLog,
	run.askSemverJump,
	run.updateVersion,
	run.gitDiff,
	run.gitStageConfigFile,
	run.gitCommit,
	run.gitTag,
	run.gitPushUpstreamFeatureBranch,
	run.npmPublish,
	run.githubUpstream,
	run.githubRelease
];
