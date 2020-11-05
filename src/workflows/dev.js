const run = require("./steps/index");
const { hasLkScope } = require("../utils");

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
	hasLkScope() ? run.addLKId : null,
	run.updatePullRequestBody,
	run.createGithubPullRequestAganistBranch
].filter(x => x);
