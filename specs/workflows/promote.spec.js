const {
	promoteWorkflow,
	promoteContinue
} = require("../../src/workflows/promote");
const run = require("../../src/workflows/steps");

describe("promote workflows", () => {
	describe("default", () => {
		it("should have all of the required steps", () => {
			expect(promoteWorkflow).toEqual([
				run.fetchUpstream,
				run.selectPrereleaseToPromote,
				run.checkoutTag,
				run.gitGenerateRebaseCommitLog,
				run.gitRemovePreReleaseCommits,
				run.gitRebaseUpstreamMaster,
				run.checkoutMaster,
				run.gitMergeUpstreamMaster,
				run.gitMergePromotionBranch,
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
				run.githubRelease,
				run.cleanUpTmpFiles,
				run.findBranchByTag,
				run.deleteLocalFeatureBranch,
				run.deleteUpstreamFeatureBranch,
				run.gitRemovePromotionBranches
			]);
		});
	});

	describe("promoteContinue", () => {
		it("should have all of the required steps", () => {
			expect(promoteContinue).toEqual([
				run.setPromote,
				run.checkoutMaster,
				run.gitMergeUpstreamMaster,
				run.gitMergePromotionBranch,
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
				run.githubRelease,
				run.cleanUpTmpFiles,
				run.findBranchByTag,
				run.deleteLocalFeatureBranch,
				run.deleteUpstreamFeatureBranch,
				run.gitRemovePromotionBranches
			]);
		});
	});
});
