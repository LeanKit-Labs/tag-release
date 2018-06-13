/* eslint-disable complexity */

const sequence = require("when/sequence");
const defaultWorkflow = require("./workflows/default");
const prereleaseWorkflow = require("./workflows/pre-release");
const resetWorkflow = require("./workflows/reset");
const { promoteWorkflow, promoteContinue } = require("./workflows/promote");
const continueWorkflow = require("./workflows/continue");
const { qaWorkflow, qaDefault, qaUpdate } = require("./workflows/qa");
const {
	prWorkflow,
	prRebaseSuccess,
	prRebaseConflict,
	prContinue
} = require("./workflows/pr");
const devWorkflow = require("./workflows/dev");

module.exports = state => {
	if (state.continue) {
		return sequence(continueWorkflow, state).then(() => {
			if (state.branch.includes("promote-release")) {
				return sequence(promoteContinue, state).then(
					() => console.log("Finished") // eslint-disable-line no-console
				);
			}

			return sequence(prContinue, state).then(
				() => console.log("Finished") // eslint-disable-line no-console
			);
		});
	}

	if (state.qa) {
		return sequence(qaWorkflow, state).then(() => {
			const onFeatureBranch =
				state.branch !== "develop" && state.branch !== "master";
			if (state.packages.length && onFeatureBranch) {
				return sequence(qaUpdate, state).then(
					() => console.log("Finished") // eslint-disable-line no-console
				);
			}

			return sequence(qaDefault, state).then(
				() => console.log("Finished") // eslint-disable-line no-console
			);
		});
	}

	if (state.pr) {
		return sequence(prWorkflow, state).then(() => {
			if (state.conflict) {
				return sequence(prRebaseConflict, state).then(
					() => console.log("Finished") // eslint-disable-line no-console
				);
			}

			return sequence(prRebaseSuccess, state).then(
				() => console.log("Finished") // eslint-disable-line no-console
			);
		});
	}

	let workflow = defaultWorkflow;
	if (state.prerelease) {
		workflow = prereleaseWorkflow;
	}

	if (state.reset) {
		workflow = resetWorkflow;
	}

	if (state.promote) {
		workflow = promoteWorkflow;
	}

	if (state.dev) {
		workflow = devWorkflow;
	}

	return sequence(workflow, state).then(() => console.log("Finished")); // eslint-disable-line no-console
};
