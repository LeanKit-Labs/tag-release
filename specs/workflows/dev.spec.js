const resetWorkflow = require("../../src/workflows/dev");
const run = require("../../src/workflows/steps");

describe("dev workflow", () => {
	it("should have all of the required steps", () => {
		expect(resetWorkflow).toEqual([
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
		]);
	});
});
