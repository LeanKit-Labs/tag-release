const resetWorkflow = require("../../src/workflows/dev");
const run = require("../../src/workflows/steps");

describe("dev workflow", () => {
	it("should have all of the required steps", () => {
		expect(resetWorkflow).toEqual([
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
		]);
	});
});
