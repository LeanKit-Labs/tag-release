import * as run from "./steps/index";
import { gitRebaseUpstreamDevelopWithConflictFlag, resolvePackageJSONConflicts, verifyConflictResolution } from "./steps/conflictResolution";
import { createPullRequest } from "./shared";

export default [
	run.gitFetchUpstream,
	run.getPackageScope,
	run.getFeatureBranch,
	run.gitRebaseUpstreamBranch,
	run.saveState,
	run.getReposFromBumpCommit,
	run.verifyPackagesToPromote,
	run.getCurrentDependencyVersions,
	gitRebaseUpstreamDevelopWithConflictFlag
];

export const prRebaseConflict = [
	resolvePackageJSONConflicts,
	verifyConflictResolution,
	run.gitStageFiles,
	run.gitRebaseContinue,
	run.getFeatureBranch,
	...createPullRequest
];

export const prRebaseSuccess = [
	...createPullRequest
];

export const prContinue = [
	run.getPackageScope,
	...createPullRequest
];
