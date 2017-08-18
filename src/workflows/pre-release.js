import * as run from "./steps";

export default [
	run.gitFetchUpstream,
	run.getCurrentBranchVersion,
	run.askPrereleaseIdentifier,
	run.getFeatureBranch,
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
