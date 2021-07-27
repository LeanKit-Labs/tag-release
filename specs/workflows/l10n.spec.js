const { sync, check, coverage } = require("../../src/workflows/l10n");
const run = require("../../src/workflows/steps");

describe("l10n workflow", () => {
	it("should have all of the required sync steps", () => {
		expect(sync).toEqual([
			run.changeDirectory,
			run.gitStash,
			run.fetchUpstream,
			run.createOrCheckoutBranch,
			run.gitMergeUpstreamBranch,
			run.gitMergeUpstreamDefaultBranchNoFF,
			run.gitPushUpstreamFeatureBranch,
			run.diffWithUpstreamDefaultBranch
		]);
	});

	it("should have all of the required check steps", () => {
		expect(check).toEqual([
			run.changeDirectory,
			run.gitStash,
			run.fetchUpstream,
			run.createOrCheckoutBranch,
			run.gitMergeUpstreamBranch,
			run.diffWithUpstreamDefaultBranch,
			run.commitDiffWithUpstreamDefaultBranch,
			run.resetIfStashed
		]);
	});

	it("should have all of the required coverage steps", () => {
		expect(coverage).toEqual([
			run.changeDirectory,
			run.gitStash,
			run.fetchUpstream,
			run.checkoutDefaultBranch,
			run.gitResetDefaultBranch,
			run.buildLocale,
			run.getLangCodes,
			run.getl10nCoverage,
			run.resetIfStashed
		]);
	});
});
