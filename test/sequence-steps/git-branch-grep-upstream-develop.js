import test from "ava";
import sinon from "sinon";
import { git } from "../helpers/index.js";

const utils = {
	exec: sinon.spy( command => new Promise( resolve => resolve( `  upstream/master
  upstream/develop
  upstream/another-branch
` ) ) )
};

import { gitBranchGrepUpstreamDevelop, __RewireAPI__ as RewireAPI } from "../../src/sequence-steps";

test.beforeEach( t => {
	utils.exec.reset();
	RewireAPI.__Rewire__( "utils", utils );
} );

test.afterEach( t => {
	RewireAPI.__ResetDependency__( "utils" );
} );

test.serial( "gitBranchGrepUpstreamDevelop calls git branch command", t => {
	return gitBranchGrepUpstreamDevelop( [ git, {} ] ).then( () => {
		t.truthy( utils.exec.calledWith( `git branch -r` ) );
	} );
} );

test.serial( "gitBranchGrepUpstreamDevelop sets options.develop=true when upstream/develop exists", t => {
	const options = { develop: false };
	return gitBranchGrepUpstreamDevelop( [ git, options ] ).then( () => {
		t.truthy( options.develop );
	} );
} );

test.serial( "gitBranchGrepUpstreamDevelop sets options.develop=false when upstream/develop doesn't exist", t => {
	const options = { develop: true };
	const myUtils = {
		exec: sinon.spy( command => new Promise( ( resolve, reject ) =>
			resolve( `  upstream/master
  upstream/not-the-develop-branch
  upstream/another-branch
` ) ) )
	};
	RewireAPI.__Rewire__( "utils", myUtils );
	return gitBranchGrepUpstreamDevelop( [ git, options ] ).then( () => {
		t.truthy( !options.develop );
	} );
} );

test.serial( "gitBranchGrepUpstreamDevelop sets options.develop=false when throws an exception", t => {
	const options = { develop: true };
	const myUtils = {
		exec: sinon.spy( command => new Promise( ( resolve, reject ) => reject() ) )
	};
	RewireAPI.__Rewire__( "utils", myUtils );
	return gitBranchGrepUpstreamDevelop( [ git, options ] ).then( () => {
		t.truthy( !options.develop );
	} );
} );
