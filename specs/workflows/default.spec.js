import defaultWorkflow from "../../src/workflows/default";
import * as run from "../../src/workflows/steps";

describe("default workflow", () => {
	it("should have all of the required steps", () => {
		expect(defaultWorkflow).toEqual([
			run.gitFetchUpstream,
			run.gitCheckoutMaster,
			run.gitMergeUpstreamMaster,
			run.getCurrentBranchVersion,
			run.checkHasDevelopBranch,
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
			run.gitCheckoutDevelop,
			run.gitMergeMaster,
			run.gitPushUpstreamDevelop,
			run.gitPushOriginMaster,
			run.githubUpstream,
			run.githubRelease
		]);
	});
});
