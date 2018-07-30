const run = require("./steps/index");
const {
	gitRebaseUpstreamBaseWithConflictFlag,
	resolvePackageJSONConflicts,
	verifyConflictResolution
} = require("./steps/conflictResolution");
const { createPullRequest } = require("./shared");

module.exports = {
	prWorkflow: [
		run.fetchUpstream,
		run.getPackageScope,
		run.gitRebaseUpstreamBranch,
		run.saveState,
		run.getReposFromBumpCommit,
		run.verifyPackagesToPromote,
		run.getCurrentDependencyVersions,
		run.saveDependencies,
		gitRebaseUpstreamBaseWithConflictFlag
	],
	prRebaseConflict: [
		resolvePackageJSONConflicts,
		verifyConflictResolution,
		run.gitStageFiles,
		run.gitRebaseContinue,
		...createPullRequest
	],
	prRebaseSuccess: [...createPullRequest],
	prContinue: [run.getPackageScope, ...createPullRequest]
};
