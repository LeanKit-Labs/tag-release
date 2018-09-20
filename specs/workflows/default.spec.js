const defaultWorkflow = require("../../src/workflows/default");
const run = require("../../src/workflows/steps");

describe("default workflow", () => {
	it("should have all of the required steps", () => {
		expect(defaultWorkflow).toEqual([
			run.fetchUpstream,
			run.checkoutMaster,
			run.gitMergeUpstreamMaster,
			run.getCurrentBranchVersion,
			run.gitMergeUpstreamDevelop,
			run.gitShortLog,
			run.previewLog,
			run.askSemverJump,
			run.updateLog,
			run.updateVersion,
			run.updateChangelog,
			run.updatePackageLockJson,
			run.gitDiff,
			run.gitAdd,
			run.gitCommit,
			run.gitTag,
			run.gitPushUpstreamMaster,
			run.npmPublish,
			run.checkoutDevelop,
			run.gitMergeDevelopWithMaster,
			run.gitPushUpstreamDevelop,
			run.gitPushOriginMaster,
			run.githubUpstream,
			run.githubRelease
		]);
	});
});
