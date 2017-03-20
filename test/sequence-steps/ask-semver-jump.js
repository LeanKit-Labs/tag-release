import test from "ava";
import sinon from "sinon";
import { git } from "../helpers/index.js";
import { askSemverJump, __RewireAPI__ as RewireAPI } from "../../src/sequence-steps";

let utils = null;

function getUtils( release ) {
	return {
		prompt: sinon.spy( command => new Promise( resolve => resolve( { release } ) ) )
	};
}

test.afterEach( t => {
	RewireAPI.__ResetDependency__( "utils" );
} );

test( "askSemverJump calls utils.prompt with choices for Major, Minor, and Patch", t => {
	utils = getUtils( "throwaway" );
	RewireAPI.__Rewire__( "utils", utils );

	return askSemverJump( [ git, {} ] ).then( () => {
		t.truthy( utils.prompt.calledWith( [ {
			type: "list",
			name: "release",
			message: "What type of release is this",
			choices: [
				{ name: "Major (Breaking Change)", value: "major", short: "l" },
				{ name: "Minor (New Feature)", value: "minor", short: "m" },
				{ name: "Patch (Bug Fix)", value: "patch", short: "s" }
			]
		} ] ) );
	} );
} );

test( "askSemverJump assigns 'major' to options.release", t => {
	const options = {};

	utils = getUtils( "major" );
	RewireAPI.__Rewire__( "utils", utils );

	return askSemverJump( [ git, options ] ).then( () => {
		t.is( options.release, "major" );
	} );
} );

test( "askSemverJump assigns 'minor' to options.release", t => {
	const options = {};

	utils = getUtils( "minor" );
	RewireAPI.__Rewire__( "utils", utils );

	return askSemverJump( [ git, options ] ).then( () => {
		t.is( options.release, "minor" );
	} );
} );

test( "askSemverJump assigns 'patch' to options.release", t => {
	const options = {};

	utils = getUtils( "patch" );
	RewireAPI.__Rewire__( "utils", utils );

	return askSemverJump( [ git, options ] ).then( () => {
		t.is( options.release, "patch" );
	} );
} );
