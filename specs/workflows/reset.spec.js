import resetWorkflow from "../../src/workflows/reset";
import * as run from "../../src/workflows/steps";

describe("reset workflow", () => {
	it("should have all of the required steps", () => {
		expect(resetWorkflow).toEqual([
			run.verifyRemotes,
			run.verifyOrigin,
			run.githubOrigin,
			run.verifyUpstream,
			run.fetchUpstream,
			run.gitStash,
			run.verifyMasterBranch,
			run.checkoutMaster,
			run.gitResetMaster,
			run.gitRemovePromotionBranches,
			run.verifyDevelopBranch,
			run.checkoutDevelop,
			run.gitResetDevelop,
			run.verifyPackageJson,
			run.verifyChangelog,
			run.cleanUpTmpFiles,
			run.resetIfStashed
		]);
	});
});
