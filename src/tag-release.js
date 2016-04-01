/* eslint no-console: 0 */

const simpleGitFactory = require( "simple-git" );
const sequence = require( "when/sequence" );
const sequenceSteps = require( "./sequence-steps" ).sequenceSteps;

module.exports = options => {
	const git = simpleGitFactory( "." );

	console.log( `Tagging a ${ options.release } release ${ options.develop ? "with" : "without" } a develop branch` );

	sequence( sequenceSteps, [ git, options ] ).then( () => console.log( "Finished" ) );
};
