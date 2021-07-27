import {
	rebaseUpdateLogCommitTagRelease,
	createPullRequest
} from "../../src/workflows/shared";
import * as run from "../../src/workflows/steps";

describe("shared workflows", () => {
	describe("rebaseUpdateLogCommitTagRelease", () => {
		it("should have all of the required steps", () => {
			expect(rebaseUpdateLogCommitTagRelease).toEqual([
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
				run.gitPushUpstreamDefaultBranch,
				run.npmPublish,
				run.checkoutDevelop,
				run.gitMergeDevelopWithDefaultBranch,
				run.gitPushUpstreamDevelop,
				run.gitPushOriginDefaultBranch,
				run.githubUpstream,
				run.githubRelease
			]);
		});
	});

	describe("createPullRequest", () => {
		it("should have all of the required steps", () => {
			expect(createPullRequest).toEqual([
				run.getDependenciesFromFile,
				run.githubUpstream,
				run.askVersions,
				run.updateDependencies,
				run.updatePackageLockJson,
				run.gitDiff,
				run.gitAdd,
				run.gitAmendCommitBumpMessage,
				run.gitForcePushUpstreamFeatureBranch,
				run.githubUpstream,
				run.createGithubPullRequestAganistBase,
				run.cleanUpTmpFiles
			]);
		});
	});
});
