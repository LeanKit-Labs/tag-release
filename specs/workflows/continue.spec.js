import continueWorkflow from "../../src/workflows/continue";
import {
	gitStageFiles,
	gitRebaseContinue,
	getFeatureBranch
} from "../../src/workflows/steps/index";
import { verifyConflictResolution } from "../../src/workflows/steps/conflictResolution";

describe("continue workflow", () => {
	it("should have all of the required steps", () => {
		expect(continueWorkflow).toEqual([
			verifyConflictResolution,
			gitStageFiles,
			gitRebaseContinue,
			getFeatureBranch
		]);
	});
});
