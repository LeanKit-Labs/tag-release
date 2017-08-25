import resetWorkflow from "../../src/workflows/reset";
import * as run from "../../src/workflows/steps";

describe( "reset workflow", () => {
	it( "should have all of the required steps", () => {
		expect( resetWorkflow ).toEqual( [
			run.gitFetchUpstream,
			run.checkHasDevelopBranch,
			run.checkForUncommittedChanges,
			run.stashIfUncommittedChangesExist,
			run.verifyMasterBranch,
			run.gitCheckoutMaster,
			run.gitResetMaster,
			run.gitRemovePromotionBranches,
			run.verifyDevelopBranch,
			run.gitCheckoutDevelop,
			run.gitResetDevelop,
			run.cleanUpTmpFiles
		] );
	} );
} );
