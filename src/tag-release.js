/* eslint no-console: 0 */

import simpleGitFactory from "simple-git";
import sequence from "when/sequence";
import { releaseSteps, preReleaseSteps, resetSteps } from "./sequence-steps";

export default options => {
	const git = simpleGitFactory( "." );
	let steps = [];

	if ( options.reset ) {
		steps = resetSteps;
	} else {
		steps = options.prerelease ? preReleaseSteps : releaseSteps;
	}

	sequence( steps, [ git, options ] ).then( () => console.log( "Finished" ) );
};
