import test from "ava";
import sinon from "sinon";
import { git } from "../helpers/index.js";

const utils = {
	exec: sinon.spy( command => Promise.resolve( "https://github.com/LeanKit-Labs/tag-release.git" ) )
};

import { githubUpstream, __RewireAPI__ as RewireAPI } from "../../src/sequence-steps";

test.beforeEach( t => {
	RewireAPI.__Rewire__( "utils", utils );
} );

test.afterEach( t => {
	RewireAPI.__ResetDependency__( "utils" );
} );

test.serial( "githubUpstream calls git remote get-url upstream", t => {
	return githubUpstream( [ git, {} ] ).then( () => {
		t.truthy( utils.exec.calledWith( `git config remote.upstream.url` ) );
	} );
} );

test.serial( "githubUpstream sets owner and name from upstream https url", t => {
	utils.exec = sinon.spy( command => Promise.resolve( "https://github.com/LeanKit-Labs/tag-release" ) );
	const options = {};
	return githubUpstream( [ git, options ] ).then( () => {
		t.is( options.github.owner, "LeanKit-Labs" );
		t.is( options.github.name, "tag-release" );
	} );
} );

test.serial( "githubUpstream sets owner and name from upstream ssh url", t => {
	utils.exec = sinon.spy( command => Promise.resolve( "git@github.com/LeanKit-Labs/tag-release.git" ) );

	const options = {};
	return githubUpstream( [ git, options ] ).then( () => {
		t.is( options.github.owner, "LeanKit-Labs" );
		t.is( options.github.name, "tag-release" );
	} );
} );

test.serial( "githubUpstream sets owner and name to undefined if no match", t => {
	const options = {};
	utils.exec = sinon.spy( command => Promise.resolve( "" ) );
	return githubUpstream( [ git, options ] ).then( () => {
		t.is( options.github.owner, undefined );
		t.is( options.github.name, undefined );
	} );
} );
