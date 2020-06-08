const run = require("./steps/index");

module.exports = [
	run.changeDirectory,
	run.setFilePaths,
	run.fetchUpstream,
	run.checkoutMaster,
	run.gitMergeUpstreamMaster,
	run.getCurrentBranchVersion,
	run.gitMergeUpstreamDevelop,
	run.gitShortLog,
	run.updateVersion,
	run.updateChangelog,
	run.updatePackageLockJson,
	run.gitAdd,
	run.gitCommit,
	run.gitTag,
	run.gitPushUpstreamMaster,
	run.checkoutDevelop,
	run.gitMergeDevelopWithMaster,
	run.gitPushUpstreamDevelop,
	run.gitPushOriginMaster,
	run.githubUpstream,
	run.githubRelease
];
