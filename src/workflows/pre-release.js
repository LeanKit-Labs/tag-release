import * as run from "./steps";

export default [
	run.gitFetchUpstreamMaster,
	run.getCurrentBranchVersion,
	run.askPrereleaseIdentifier,
	run.getFeatureBranch,
	run.gitMergeUpstreamBranch,
	run.gitShortLog,
	run.previewLog,
	run.askSemverJump,
	run.updateLog,
	run.updateVersion,
	run.gitDiff,
	run.gitAdd,
	run.gitCommit,
	run.gitTag,
	run.gitPushUpstreamFeatureBranch,
	run.npmPublish,
	run.githubUpstream,
	run.githubRelease
];
