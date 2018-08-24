const { gitStageFiles, gitRebaseContinue } = require("./steps/index");
const { verifyConflictResolution } = require("./steps/conflictResolution");

module.exports = [verifyConflictResolution, gitStageFiles, gitRebaseContinue];
