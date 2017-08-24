import continueWorkflow from "../../src/workflows/continue";
import * as run from "../../src/workflows/steps";

describe( "continue workflow", () => {
	it( "should have all of the required steps", () => {
		expect( continueWorkflow ).toEqual( [
			run.verifyConflictResolution,
			run.gitStageFiles,
			run.gitRebaseContinue,
			run.getFeatureBranch
		] );
	} );
} );
