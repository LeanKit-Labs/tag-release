import * as run from "./steps";

export default [
	run.verifyConflictResolution,
	run.gitStageFiles,
	run.gitRebaseContinue,
	run.getFeatureBranch
];
