import { default as prWorkflow, keepTheBallRolling } from "../../src/workflows/pr";
import * as run from "../../src/workflows/steps";

describe( "pr workflows", () => {
	describe( "default", () => {
		it( "should have all of the required steps", () => {
			expect( prWorkflow ).toEqual( [
				run.gitFetchUpstream,
				run.getPackageScope,
				run.getFeatureBranch,
				run.gitRebaseUpstreamBranch,
				run.saveState,
				run.gitRebaseUpstreamDevelop,
				run.getReposFromBumpCommit,
				run.verifyPackagesToPromote,
				run.getCurrentDependencyVersions,
				run.githubUpstream,
				run.askVersions,
				run.updateDependencies,
				run.gitDiff,
				run.gitAdd,
				run.gitAmendCommitBumpMessage,
				run.gitForcePushUpstreamFeatureBranch,
				run.githubUpstream,
				run.createGithubPullRequestAganistDevelop,
				run.cleanUpTmpFiles
			] );
		} );
	} );

	describe( "keepTheBallRolling", () => {
		expect( keepTheBallRolling ).toEqual( [
			run.getPackageScope,
			run.getReposFromBumpCommit,
			run.verifyPackagesToPromote,
			run.getCurrentDependencyVersions,
			run.githubUpstream,
			run.askVersions,
			run.updateDependencies,
			run.gitDiff,
			run.gitAdd,
			run.gitAmendCommitBumpMessage,
			run.gitForcePushUpstreamFeatureBranch,
			run.githubUpstream,
			run.createGithubPullRequestAganistDevelop,
			run.cleanUpTmpFiles
		] );
	} );
} );
