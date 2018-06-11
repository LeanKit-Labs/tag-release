const continueWorkflow = require("../../src/workflows/continue");
const {
	gitStageFiles,
	gitRebaseContinue,
	getFeatureBranch
} = require("../../src/workflows/steps/index");
const {
	verifyConflictResolution
} = require("../../src/workflows/steps/conflictResolution");

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
