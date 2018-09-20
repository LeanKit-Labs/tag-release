const run = require("./steps/index");

module.exports = {
	qaWorkflow: [run.fetchUpstream, run.getReposFromBumpCommit],
	qaDefault: [
		run.getCurrentBranchVersion,
		run.checkNewCommits,
		run.useCurrentOrBaseBranch,
		run.gitRebaseUpstreamDevelop,
		run.getPackageScope,
		run.askReposToUpdate,
		run.getCurrentDependencyVersions,
		run.askChangeReason,
		run.githubUpstream,
		run.askVersions,
		run.promptKeepBranchOrCreateNew,
		run.askChangeType,
		run.promptBranchName,
		run.checkoutAndCreateBranch,
		run.updateDependencies,
		run.gitDiff,
		run.gitAdd,
		run.gitCommitBumpMessage,
		run.gitPushUpstreamFeatureBranch
	],
	qaUpdate: [
		run.getPackageScope,
		run.getCurrentDependencyVersions,
		run.githubUpstream,
		run.askVersions,
		run.updateDependencies,
		run.gitDiff,
		run.gitAdd,
		run.gitAmendCommitBumpMessage,
		run.gitForcePushUpstreamFeatureBranch
	]
};
