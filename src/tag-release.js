import sequence from "when/sequence";
import defaultWorkflow from "./workflows/default";
import prereleaseWorkflow from "./workflows/pre-release";
import resetWorkflow from "./workflows/reset";

export default state => {
	let workflow = defaultWorkflow;

	if ( state.prerelease ) {
		workflow = prereleaseWorkflow;
	}

	if ( state.reset ) {
		workflow = resetWorkflow;
	}

	sequence( workflow, state ).then( () => console.log( "Finished" ) ); // eslint-disable-line no-console
};
