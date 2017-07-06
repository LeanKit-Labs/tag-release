import * as run from "./steps";

export default [
	run.gitFetchUpstreamMaster,
	run.checkHasDevelopBranch,
	run.gitCheckoutMaster,
	run.gitMergeUpstreamMaster,
	run.getCurrentBranchVersion,
	run.gitMergeUpstreamDevelop,
	run.gitShortLog,
	run.previewLog,
	run.askSemverJump,
	run.updateLog,
	run.updateVersion,
	run.updateChangelog,
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
];
