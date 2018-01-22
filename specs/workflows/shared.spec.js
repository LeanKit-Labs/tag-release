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
				run.checkHasDevelopBranch,
				run.gitMergeUpstreamDevelop,
				run.gitShortLog,
				run.previewLog,
				run.askSemverJump,
				run.updateLog,
				run.updateVersion,
				run.updateChangelog,
				run.gitDiff,
				run.updatePackageLockJson,
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

	describe("createPullRequest", () => {
		it("should have all of the required steps", () => {
			expect(createPullRequest).toEqual([
				run.getDependenciesFromFile,
				run.verifyPackagesToPromote,
				run.getCurrentDependencyVersions,
				run.githubUpstream,
				run.askVersions,
				run.updateDependencies,
				run.gitDiff,
				run.updatePackageLockJson,
				run.gitAdd,
				run.gitAmendCommitBumpMessage,
				run.gitForcePushUpstreamFeatureBranch,
				run.githubUpstream,
				run.createGithubPullRequestAganistDevelop,
				run.cleanUpTmpFiles
			]);
		});
	});
});
