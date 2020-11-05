const run = require("./steps/index");

module.exports = [
	run.fetchUpstream,
	run.gitCreateBranchOrigin,
	run.checkoutBaseBranch,
	run.rebaseUpstreamBaseBranch,
	run.checkoutWorkingBranch,
	run.gitCreateBranchUpstream,
	run.githubUpstream,
	run.githubOrigin,
	run.updatePullRequestTitle,
	run.addLKId,
	run.updatePullRequestBody,
	run.createGithubPullRequestAganistBranch
];
