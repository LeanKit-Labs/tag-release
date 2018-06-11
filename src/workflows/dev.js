const run = require("./steps/index");

module.exports = [
	run.gitFetchUpstream,
	run.checkHasDevelopBranch,
	run.getFeatureBranch,
	run.gitCreateBranchOrigin,
	run.gitCheckoutDevelopOrMaster,
	run.gitRebaseUpstreamDevelopOrMaster,
	run.gitCheckoutBranch,
	run.gitCreateBranchUpstream,
	run.githubUpstream,
	run.githubOrigin,
	run.updatePullRequestTitle,
	run.updatePullRequestBody,
	run.createGithubPullRequestAganistBranch
];
