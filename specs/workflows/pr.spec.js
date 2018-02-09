import {
	default as prWorkflow,
	prRebaseConflict,
	prRebaseSuccess,
	prContinue
} from "../../src/workflows/pr";
import * as run from "../../src/workflows/steps/index";
import {
	gitRebaseUpstreamDevelopWithConflictFlag,
	resolvePackageJSONConflicts,
	verifyConflictResolution
} from "../../src/workflows/steps/conflictResolution";

describe("pr workflows", () => {
	describe("default", () => {
		it("should have all of the required steps", () => {
			expect(prWorkflow).toEqual([
				run.gitFetchUpstream,
				run.getPackageScope,
				run.getFeatureBranch,
				run.gitRebaseUpstreamBranch,
				run.saveState,
				run.getReposFromBumpCommit,
				run.verifyPackagesToPromote,
				run.getCurrentDependencyVersions,
				run.saveDependencies,
				gitRebaseUpstreamDevelopWithConflictFlag
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
				run.getFeatureBranch,
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
				run.createGithubPullRequestAganistDevelop,
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
				run.createGithubPullRequestAganistDevelop,
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
				run.createGithubPullRequestAganistDevelop,
				run.cleanUpTmpFiles
			]);
		});
	});
});
