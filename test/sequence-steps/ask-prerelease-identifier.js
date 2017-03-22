import test from "ava";
import sinon from "sinon";
import { git } from "../helpers/index.js";
import { askPrereleaseIdentifier, __RewireAPI__ as RewireAPI } from "../../src/sequence-steps";

let utils = null;

function getUtils( release ) {
	return {
		prompt: sinon.spy( command => new Promise( resolve => resolve( { release } ) ) )
	};
}

test.serial( "should prompt for a prerelease identifier when no tag is provided", t => {
	utils = getUtils( "prerelease" );
	RewireAPI.__Rewire__( "utils", utils );

	return askPrereleaseIdentifier( [ git, {} ] ).then( () => {
		t.truthy( utils.prompt.calledWith( [ {
			type: "input",
			name: "prereleaseIdentifier",
			message: "Prerelease Identifier:"
		} ] ) );
	} );
} );

test.serial( "should prompt for a prerelease identifier with a default value when the prerelease option is true and options.tag is set", t => {
	utils = getUtils( "prerelease" );
	RewireAPI.__Rewire__( "utils", utils );

	return askPrereleaseIdentifier( [ git, { tag: "test" } ] ).then( () => {
		t.truthy( !utils.prompt.called );
	} );
} );
