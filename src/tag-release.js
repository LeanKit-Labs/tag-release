/* eslint no-console: 0 */

import simpleGitFactory from "simple-git";
import sequence from "when/sequence";
import { releaseSteps, preReleaseSteps } from "./sequence-steps";

export default options => {
	const git = simpleGitFactory( "." );

	const steps = options.prerelease ? preReleaseSteps : releaseSteps;

	sequence( steps, [ git, options ] ).then( () => console.log( "Finished" ) );
};
