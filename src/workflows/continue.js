import * as run from "./steps/index";
import * as run2 from "./steps/conflictResolution";

export default [
	run2.verifyConflictResolution,
	run.gitStageFiles,
	run.gitRebaseContinue,
	run.getFeatureBranch
];
