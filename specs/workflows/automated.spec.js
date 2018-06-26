const defaultWorkflow = require("../../src/workflows/automated");
const run = require("../../src/workflows/steps");

describe("default workflow", () => {
	it("should have all of the required steps", () => {
		expect(defaultWorkflow).toEqual([
			run.changeDirectory,
			run.gitFetchUpstream,
			run.gitCheckoutMaster,
			run.gitMergeUpstreamMaster,
			run.getCurrentBranchVersion,
			run.checkHasDevelopBranch,
			run.gitMergeUpstreamDevelop,
			run.gitShortLog,
			run.updateVersion,
			run.updateChangelog,
			run.updatePackageLockJson,
			run.gitAdd,
			run.gitCommit,
			run.gitTag,
			run.gitPushUpstreamMaster,
			run.gitCheckoutDevelop,
			run.gitMergeMaster,
			run.gitPushUpstreamDevelop,
			run.gitPushOriginMaster,
			run.githubUpstream,
			run.githubRelease
		]);
	});
});
