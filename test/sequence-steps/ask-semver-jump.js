import test from "ava";
import sinon from "sinon";
import { git } from "../helpers/index.js";
import { askSemverJump, __RewireAPI__ as RewireAPI } from "../../src/sequence-steps";

let utils = null;

const chalk = { gray: sinon.stub().returnsArg( 0 ) };

function getUtils( release ) {
	return {
		prompt: sinon.spy( command => new Promise( resolve => resolve( { release } ) ) ),
		advise: sinon.stub(),
		readJSONFile: sinon.stub().returns( { version: "1.0.0" } )
	};
}

test.beforeEach( t => {
	RewireAPI.__Rewire__( "chalk", chalk );
} );

test.afterEach.always( t => {
	RewireAPI.__ResetDependency__( "chalk" );
} );

test.afterEach( t => {
	RewireAPI.__ResetDependency__( "utils" );
} );

test.serial( "askSemverJump calls utils.prompt with choices for Major, Minor, and Patch when the prerelease option is false", t => {
	utils = getUtils( "throwaway" );
	RewireAPI.__Rewire__( "utils", utils );

	return askSemverJump( [ git, { prerelease: false, currentVersion: "1.0.0" } ] ).then( () => {
		t.truthy( utils.prompt.calledWith( [ {
			type: "list",
			name: "release",
			message: "What type of release is this",
			choices: [
				{ name: "Major (Breaking Change) v2.0.0", value: "major", short: "l" },
				{ name: "Minor (New Feature) v1.1.0", value: "minor", short: "m" },
				{ name: "Patch (Bug Fix) v1.0.1", value: "patch", short: "s" }
			]
		} ] ) );
	} );
} );

test.serial( "askSemverJump calls utils.prompt with choices for Pre-Major, Pre-Minor, Pre-Patch and Pre-Release when the prerelease option is true", t => {
	utils = getUtils( "throwaway" );
	RewireAPI.__Rewire__( "utils", utils );

	return askSemverJump( [ git, { prerelease: true, tag: "test", currentVersion: "1.0.0" } ] ).then( () => {
		t.truthy( utils.prompt.calledWith( [ {
			type: "list",
			name: "release",
			message: "What type of release is this",
			choices: [
				{ name: "Pre-Major (Breaking Change) v2.0.0-test.0", value: "premajor", short: "p-l" },
				{ name: "Pre-Minor (New Feature) v1.1.0-test.0", value: "preminor", short: "p-m" },
				{ name: "Pre-Patch (Bug Fix) v1.0.1-test.0", value: "prepatch", short: "p-s" },
				{ name: "Pre-Release (Bump existing Pre-Release) v1.0.1-test.0", value: "prerelease", short: "p-r" }
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
