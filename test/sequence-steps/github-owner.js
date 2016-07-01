import test from "ava";
import sinon from "sinon";
import { git } from "../helpers/index.js";

const utils = {
	exec: sinon.spy( command => Promise.resolve( "https://github.com/LeanKit-Labs/tag-release.git" ) )
};

import { githubOwner, __RewireAPI__ as RewireAPI } from "../../src/sequence-steps";

test.beforeEach( t => {
	RewireAPI.__Rewire__( "utils", utils );
} );

test.afterEach( t => {
	RewireAPI.__ResetDependency__( "utils" );
} );

test.serial( "githubOwner calls git remote get-url upstream", t => {
	return githubOwner( [ git, {} ] ).then( () => {
		t.truthy( utils.exec.calledWith( `git remote get-url upstream` ) );
	} );
} );

test.serial( "githubOwner sets options.githubOwner from upsream url", t => {
	const options = {};
	return githubOwner( [ git, options ] ).then( () => {
		t.is( options.githubOwner, "LeanKit-Labs" );
	} );
} );

test.serial( "githubOwner sets options.githubOwner to undefined if no match", t => {
	const options = {};
	utils.exec = sinon.spy( command => Promise.resolve( "" ) );
	return githubOwner( [ git, options ] ).then( () => {
		t.is( options.githubOwner, undefined );
	} );
} );
