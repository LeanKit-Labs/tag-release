const {
	prWorkflow,
	prNoBump,
	prRebaseConflict,
	prRebaseSuccess,
	prContinue
} = require("../../src/workflows/pr");
const run = require("../../src/workflows/steps/index");
const {
	gitRebaseUpstreamBaseWithConflictFlag,
	resolvePackageJSONConflicts,
	verifyConflictResolution
} = require("../../src/workflows/steps/conflictResolution");

describe("pr workflows", () => {
	describe("default", () => {
		it("should have all of the required steps", () => {
			expect(prWorkflow).toEqual([
				run.fetchUpstream,
				run.getPackageScope,
				run.gitRebaseUpstreamBranch,
				run.saveState,
				run.checkIfReOrderNeeded,
				run.reOrderLatestCommits,
				run.reOrderBumpCommit,
				run.getReposFromBumpCommit,
				run.verifyPackagesToPromote,
				run.getCurrentDependencyVersions,
				run.saveDependencies,
				gitRebaseUpstreamBaseWithConflictFlag
			]);
		});
	});

	describe("prNoBump", () => {
		it("should have all of the required steps", () => {
			expect(prNoBump).toEqual([
				run.fetchUpstream,
				run.gitRebaseUpstreamBranch,
				run.githubUpstream,
				run.updatePullRequestTitle,
				run.createGithubPullRequestAganistBase
			]);
		});
	});

	describe("prRebaseConflict", () => {
		it("should have all of the required steps", () => {
			expect(prRebaseConflict).toEqual([
				resolvePackageJSONConflicts,
				verifyConflictResolution,
				run.gitStageFiles,
				run.gitRebaseContinue,
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

	describe("prRebaseSuccess", () => {
		it("should have all of the required steps", () => {
			expect(prRebaseSuccess).toEqual([
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

	describe("prContinue", () => {
		it("should have all of the required steps", () => {
			expect(prContinue).toEqual([
				run.getPackageScope,
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
