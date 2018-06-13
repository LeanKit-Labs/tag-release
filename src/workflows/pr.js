const run = require("./steps/index");
const {
	gitRebaseUpstreamDevelopWithConflictFlag,
	resolvePackageJSONConflicts,
	verifyConflictResolution
} = require("./steps/conflictResolution");
const { createPullRequest } = require("./shared");

module.exports = {
	prWorkflow: [
		run.gitFetchUpstream,
		run.getPackageScope,
		run.getFeatureBranch,
		run.gitRebaseUpstreamBranch,
		run.saveState,
		run.getReposFromBumpCommit,
		run.verifyPackagesToPromote,
		run.getCurrentDependencyVersions,
		run.saveDependencies,
		gitRebaseUpstreamDevelopWithConflictFlag
	],
	prRebaseConflict: [
		resolvePackageJSONConflicts,
		verifyConflictResolution,
		run.gitStageFiles,
		run.gitRebaseContinue,
		run.getFeatureBranch,
		...createPullRequest
	],
	prRebaseSuccess: [...createPullRequest],
	prContinue: [run.getPackageScope, ...createPullRequest]
};
