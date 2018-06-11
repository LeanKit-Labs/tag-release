const { qaWorkflow, qaDefault, qaUpdate } = require("../../src/workflows/qa");
const run = require("../../src/workflows/steps");

describe("qa workflows", () => {
	describe("qaWorkflow", () => {
		it("should have all of the required steps", () => {
			expect(qaWorkflow).toEqual([
				run.gitFetchUpstream,
				run.getFeatureBranch,
				run.getReposFromBumpCommit
			]);
		});
	});
	describe("qaDefault", () => {
		it("should have all of the required steps", () => {
			expect(qaDefault).toEqual([
				run.checkHasDevelopBranch,
				run.getCurrentBranchVersion,
				run.checkNewCommits,
				run.useCurrentBranchOrCheckoutDevelop,
				run.gitRebaseUpstreamDevelop,
				run.getPackageScope,
				run.askReposToUpdate,
				run.verifyPackagesToPromote,
				run.getCurrentDependencyVersions,
				run.askChangeReason,
				run.githubUpstream,
				run.askVersions,
				run.promptKeepBranchOrCreateNew,
				run.askChangeType,
				run.promptBranchName,
				run.gitCheckoutAndCreateBranch,
				run.getFeatureBranch,
				run.updateDependencies,
				run.gitDiff,
				run.gitAdd,
				run.gitCommitBumpMessage,
				run.gitPushUpstreamFeatureBranch
			]);
		});
	});
	describe("qaUpdate", () => {
		it("should have all of the required steps", () => {
			expect(qaUpdate).toEqual([
				run.getPackageScope,
				run.getCurrentDependencyVersions,
				run.githubUpstream,
				run.askVersions,
				run.updateDependencies,
				run.gitDiff,
				run.gitAdd,
				run.gitAmendCommitBumpMessage,
				run.gitForcePushUpstreamFeatureBranch
			]);
		});
	});
});
