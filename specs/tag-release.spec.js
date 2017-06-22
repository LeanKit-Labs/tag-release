jest.mock( "when/sequence", () => {
	return jest.fn( () => Promise.resolve() );
} );

jest.mock( "../src/workflows/default", () => {
	return "default";
} );

jest.mock( "../src/workflows/pre-release", () => {
	return "pre-release";
} );

jest.mock( "../src/workflows/reset", () => {
	return "reset";
} );

jest.mock( "../src/workflows/promote", () => {
	return "promote";
} );

jest.mock( "../src/workflows/continue", () => {
	return "continue";
} );

import sequence from "when/sequence";
import defaultWorkflow from "../src/workflows/default";
import prereleaseWorkflow from "../src/workflows/pre-release";
import resetWorkflow from "../src/workflows/reset";
import promoteWorkflow from "../src/workflows/promote";
import continueWorkflow from "../src/workflows/continue";
import tagRelease from "../src/tag-release";

describe( "tag-release", () => {
	beforeEach( () => {
		sequence.mockImplementation( jest.fn( () => Promise.resolve() ) );
		console.log = jest.fn(); // eslint-disable-line no-console
	} );

	it( "should run the default workflow by default", () => {
		tagRelease( {} );
		expect( sequence ).toHaveBeenCalledTimes( 1 );
		expect( sequence ).toHaveBeenCalledWith( defaultWorkflow, {} );
	} );

	it( "should run the pre-release workflow when the CLI flag is passed", () => {
		tagRelease( { prerelease: true } );
		expect( sequence ).toHaveBeenCalledTimes( 1 );
		expect( sequence ).toHaveBeenCalledWith( prereleaseWorkflow, { prerelease: true } );
	} );

	it( "should run the pre-release workflow when the CLI flag is passed", () => {
		tagRelease( { reset: true } );
		expect( sequence ).toHaveBeenCalledTimes( 1 );
		expect( sequence ).toHaveBeenCalledWith( resetWorkflow, { reset: true } );
	} );

	it( "should run the reset workflow when both prerelease and reset flags are passed", () => {
		tagRelease( { prerelease: true, reset: true } );
		expect( sequence ).toHaveBeenCalledTimes( 1 );
		expect( sequence ).toHaveBeenCalledWith( resetWorkflow, { prerelease: true, reset: true } );
	} );

	it( "should run the promote workflow when the CLI flag is passed", () => {
		tagRelease( { promote: true } );
		expect( sequence ).toHaveBeenCalledTimes( 1 );
		expect( sequence ).toHaveBeenCalledWith( promoteWorkflow, { promote: true } );
	} );

	it( "should run the continue workflow when when the CLI flag is passed", () => {
		tagRelease( { continue: true } );
		expect( sequence ).toHaveBeenCalledTimes( 1 );
		expect( sequence ).toHaveBeenCalledWith( continueWorkflow, { continue: true } );
	} );
} );
