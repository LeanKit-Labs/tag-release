const l10n = require("../../src/workflows/l10n");
const run = require("../../src/workflows/steps");

describe("l10n workflow", () => {
	it("should have all of the required steps", () => {
		expect(l10n).toEqual([
			run.changeDirectory,
			run.stashChanges,
			run.fetchUpstream,
			run.createOrCheckoutBranch,
			run.gitMergeUpstreamBranch,
			run.gitMergeUpstreamMasterNoFF,
			run.gitPushUpstreamFeatureBranch,
			run.diffWithUpstreamMaster
		]);
	});
});
