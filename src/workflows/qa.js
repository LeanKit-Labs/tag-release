const run = require("./steps/index");

module.exports = {
	qaWorkflow: [
		run.gitFetchUpstream,
		run.getFeatureBranch,
		run.getReposFromBumpCommit
	],
	qaDefault: [
		run.checkHasDevelopBranch,
		run.getCurrentBranchVersion,
		run.checkNewCommits,
		run.useCurrentBranchOrCheckoutDevelop,
		run.gitRebaseUpstreamDevelop,
		run.getPackageScope,
		run.askReposToUpdate,
		run.verifyPackagesToPromote,
		run.getCurrentDependencyVersions,
		run.askChangeReason,
		run.githubUpstream,
		run.askVersions,
		run.promptKeepBranchOrCreateNew,
		run.askChangeType,
		run.promptBranchName,
		run.gitCheckoutAndCreateBranch,
		run.getFeatureBranch,
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
