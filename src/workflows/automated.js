const run = require("./steps/index");

module.exports = [
	run.changeDirectory,
	run.setFilePaths,
	run.fetchUpstream,
	run.checkoutDefaultBranch,
	run.gitMergeUpstreamDefaultBranch,
	run.getCurrentBranchVersion,
	run.gitMergeUpstreamDevelop,
	run.gitShortLog,
	run.updateVersion,
	run.updateChangelog,
	run.updatePackageLockJson,
	run.gitAdd,
	run.gitCommit,
	run.gitTag,
	run.gitPushUpstreamDefaultBranch,
	run.checkoutDevelop,
	run.gitMergeDevelopWithDefaultBranch,
	run.gitPushUpstreamDevelop,
	run.gitPushOriginDefaultBranch,
	run.githubUpstream,
	run.githubRelease
];
