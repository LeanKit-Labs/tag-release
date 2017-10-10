import {
	gitStageFiles,
	gitRebaseContinue,
	getFeatureBranch
} from "./steps/index";
import { verifyConflictResolution } from "./steps/conflictResolution";

export default [
	verifyConflictResolution,
	gitStageFiles,
	gitRebaseContinue,
	getFeatureBranch
];
