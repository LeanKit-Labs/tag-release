const run = require("./steps/index");

/**
 * REQUIRES:
 * state.dependencies = [ { pkg: "repo_name", version: "1.1.1-some.0" } ]
 * state.changeReason = "some change reason"
 *
 * TODO:
 * might want to generalize this so it isn't only to be used
 * for the automation of the l10n host project branch
 */

module.exports = [
	run.changeDirectory,
	run.stashChanges,
	run.checkoutl10nBranch,
	run.getCurrentBranchVersion,
	run.checkNewCommits,
	run.getPackageScope,
	run.githubUpstream,
	run.updateDependencies,
	run.gitAdd,
	run.gitCommitBumpMessage,
	run.gitPushUpstreamFeatureBranch,
	run.resetIfStashed
];
