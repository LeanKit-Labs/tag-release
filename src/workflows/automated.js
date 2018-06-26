const run = require("./steps/index");

module.exports = [
	run.changeDirectory,
	run.gitFetchUpstream,
	run.gitCheckoutMaster,
	run.gitMergeUpstreamMaster,
	run.getCurrentBranchVersion,
	run.checkHasDevelopBranch,
	run.gitMergeUpstreamDevelop,
	run.gitShortLog,
	run.updateVersion,
	run.updateChangelog,
	run.updatePackageLockJson,
	run.gitAdd,
	run.gitCommit,
	run.gitTag,
	run.gitPushUpstreamMaster,
	run.gitCheckoutDevelop,
	run.gitMergeMaster,
	run.gitPushUpstreamDevelop,
	run.gitPushOriginMaster,
	run.githubUpstream,
	run.githubRelease
];
