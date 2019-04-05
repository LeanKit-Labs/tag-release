const qaAuto = require("../../src/workflows/qa-automated");
const run = require("../../src/workflows/steps");

describe("qa-automated workflow", () => {
	it("should have all of the required steps", () => {
		expect(qaAuto).toEqual([
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
		]);
	});
});
