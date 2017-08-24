import { default as promoteWorkflow, keepTheBallRolling } from "../../src/workflows/promote";
import * as run from "../../src/workflows/steps";

describe( "promote workflows", () => {
	describe( "default", () => {
		it( "should have all of the required steps", () => {
			expect( promoteWorkflow ).toEqual( [
				run.gitFetchUpstream,
				run.selectPrereleaseToPromote,
				run.gitCheckoutTag,
				run.getFeatureBranch,
				run.gitGenerateRebaseCommitLog,
				run.gitRemovePreReleaseCommits,
				run.gitRebaseUpstreamMaster,
				run.gitCheckoutMaster,
				run.gitMergeUpstreamMaster,
				run.gitMergePromotionBranch,
				run.gitMergeUpstreamBranch,
				run.checkHasDevelopBranch,
				run.getCurrentBranchVersion,
				run.gitMergeUpstreamDevelop,
				run.gitShortLog,
				run.previewLog,
				run.askSemverJump,
				run.updateLog,
				run.updateVersion,
				run.updateChangelog,
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
				run.githubRelease,
				run.cleanUpTmpFiles
			] );
		} );
	} );

	describe( "keepTheBallRolling", () => {
		it( "should have all of the required steps", () => {
			expect( keepTheBallRolling ).toEqual( [
				run.setPromote,
				run.checkHasDevelopBranch,
				run.gitCheckoutMaster,
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
				run.githubRelease,
				run.cleanUpTmpFiles
			] );
		} );
	} );
} );
