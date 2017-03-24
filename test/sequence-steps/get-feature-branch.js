import test from "ava";
import sinon from "sinon";
import { git } from "../helpers/index.js";

const utils = {
	log: {
		begin: sinon.spy(),
		end: sinon.spy()
	},
	exec: sinon.spy( command => new Promise( resolve => resolve( "feature-branch" ) ) )
};

import { getFeatureBranch, __RewireAPI__ as RewireAPI } from "../../src/sequence-steps";

test.beforeEach( t => {
	RewireAPI.__Rewire__( "utils", utils );
} );

test.afterEach( t => {
	RewireAPI.__ResetDependency__( "utils" );
} );

test.serial( "getFeatureBranch calls log.begin", t => {
	return getFeatureBranch( [ git, {} ] ).then( () => {
		t.truthy( utils.log.begin.called );
	} );
} );

test.serial( "getFeatureBranch calls utils.exec with command", t => {
	const COMMAND = "git rev-parse --abbrev-ref HEAD";
	return getFeatureBranch( [ git, {} ] ).then( () => {
		t.truthy( utils.exec.calledWith( COMMAND ) );
	} );
} );

test.serial( "getFeatureBranch sets options.branch to current branch", t => {
	const options = { branch: undefined };
	return getFeatureBranch( [ git, options ] ).then( () => {
		t.is( options.branch, "feature-branch" );
	} );
} );

test.serial( "getFeatureBranch calls log.end", t => {
	return getFeatureBranch( [ git, {} ] ).then( () => {
		t.truthy( utils.log.end.called );
	} );
} );
