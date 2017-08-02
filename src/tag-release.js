/* eslint-disable complexity */

import sequence from "when/sequence";
import defaultWorkflow from "./workflows/default";
import prereleaseWorkflow from "./workflows/pre-release";
import resetWorkflow from "./workflows/reset";
import promoteWorkflow, { keepTheBallRolling as promoteContinue } from "./workflows/promote";
import continueWorkflow from "./workflows/continue";
import qaWorkflow, { qaDefault, qaUpdate } from "./workflows/qa";
import prWorkflow, { keepTheBallRolling as prContinue } from "./workflows/pr";

export default state => {
	if ( state.continue ) {
		return sequence( continueWorkflow, state ).then( () => {
			if ( state.branch.includes( "promote-release" ) ) {
				return sequence( promoteContinue, state ).then( () => console.log( "Finished" ) ); // eslint-disable-line no-console
			}

			return sequence( prContinue, state ).then( () => console.log( "Finished" ) ); // eslint-disable-line no-console
		} );
	}

	if ( state.qa ) {
		return sequence( qaWorkflow, state ).then( () => {
			if ( state.packages.length ) {
				return sequence( qaUpdate, state ).then( () => console.log( "Finished" ) ); // eslint-disable-line no-console
			}

			return sequence( qaDefault, state ).then( () => console.log( "Finished" ) ); // eslint-disable-line no-console
		} );
	}

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

	if ( state.pr ) {
		workflow = prWorkflow;
	}

	return sequence( workflow, state ).then( () => console.log( "Finished" ) ); // eslint-disable-line no-console
};
