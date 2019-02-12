const l10nDry = require("../../src/workflows/l10n-dry");
const run = require("../../src/workflows/steps");

describe("l10n-dry workflow", () => {
	it("should have all of the required steps", () => {
		expect(l10nDry).toEqual([
			run.changeDirectory,
			run.stashChanges,
			run.fetchUpstream,
			run.createOrCheckoutBranch,
			run.gitMergeUpstreamBranch,
			run.diffWithUpstreamMaster
		]);
	});
});
