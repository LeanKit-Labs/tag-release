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

import { getCurrentBranch, __RewireAPI__ as RewireAPI } from "../../src/sequence-steps";

test.beforeEach( t => {
	RewireAPI.__Rewire__( "utils", utils );
} );

test.afterEach( t => {
	RewireAPI.__ResetDependency__( "utils" );
} );

test.serial( "getCurrentBranch calls log.begin", t => {
	return getCurrentBranch( [ git, {} ] ).then( () => {
		t.truthy( utils.log.begin.called );
	} );
} );

test.serial( "getCurrentBranch calls utils.exec with command", t => {
	const COMMAND = "git rev-parse --abbrev-ref HEAD";
	return getCurrentBranch( [ git, {} ] ).then( () => {
		t.truthy( utils.exec.calledWith( COMMAND ) );
	} );
} );

test.serial( "getCurrentBranch sets options.branch to current branch", t => {
	const options = { branch: undefined };
	return getCurrentBranch( [ git, options ] ).then( () => {
		t.is( options.branch, "feature-branch" );
	} );
} );

test.serial( "getCurrentBranch calls log.end", t => {
	return getCurrentBranch( [ git, {} ] ).then( () => {
		t.truthy( utils.log.end.called );
	} );
} );
