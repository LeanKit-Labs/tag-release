import sequence from "when/sequence";
import defaultWorkflow from "./workflows/default";
import prereleaseWorkflow from "./workflows/pre-release";
import resetWorkflow from "./workflows/reset";
import promoteWorkflow from "./workflows/promote";
import continueWorkflow from "./workflows/continue";
import qaWorkflow from "./workflows/qa";

export default state => {
	let workflow = defaultWorkflow;

	if ( state.prerelease ) {
		workflow = prereleaseWorkflow;
	}

	if ( state.reset ) {
		workflow = resetWorkflow;
	}

	if ( state.promote ) {
		workflow = promoteWorkflow;
	}

	if ( state.continue ) {
		workflow = continueWorkflow;
	}

	if ( state.qa ) {
		workflow = qaWorkflow;
	}

	sequence( workflow, state ).then( () => console.log( "Finished" ) ); // eslint-disable-line no-console
};
