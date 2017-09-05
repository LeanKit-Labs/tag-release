import continueWorkflow from "../../src/workflows/continue";
import * as run from "../../src/workflows/steps/index";
import * as run2 from "../../src/workflows/steps/conflictResolution";

describe( "continue workflow", () => {
	it( "should have all of the required steps", () => {
		expect( continueWorkflow ).toEqual( [
			run2.verifyConflictResolution,
			run.gitStageFiles,
			run.gitRebaseContinue,
			run.getFeatureBranch
		] );
	} );
} );
