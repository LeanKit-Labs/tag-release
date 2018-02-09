import resetWorkflow from "../../src/workflows/dev";
import * as run from "../../src/workflows/steps";

describe("dev workflow", () => {
	it("should have all of the required steps", () => {
		expect(resetWorkflow).toEqual([
			run.gitFetchUpstream,
			run.checkHasDevelopBranch,
			run.getFeatureBranch,
			run.gitCreateBranchOrigin,
			run.gitCreateBranchUpstream,
			run.githubUpstream,
			run.githubOrigin,
			run.updatePullRequestTitle,
			run.updatePullRequestBody,
			run.createGithubPullRequestAganistBranch
		]);
	});
});
