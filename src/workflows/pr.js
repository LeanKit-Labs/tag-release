import * as run from "./steps/index";
import * as run2 from "./steps/conflictResolution";
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
	run2.gitRebaseUpstreamDevelopWithConflictFlag
];

export const prRebaseConflict = [
	run2.resolvePackageJSONConflicts,
	run2.verifyConflictResolution,
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
