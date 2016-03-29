/* eslint no-console: 0 */

import simpleGitFactory from "simple-git";
import sequence from "when/sequence";
import sequenceSteps from "./sequence-steps";

export default options => {
	const git = simpleGitFactory( "." );

	console.log( `Tagging a ${ options.release } release ${ options.develop ? "with" : "without" } a develop branch` );

	sequence( sequenceSteps, [ git, options ] ).then( () => console.log( "Finished" ) );
};
