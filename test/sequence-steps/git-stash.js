import test from "ava";
import sinon from "sinon";
import { git, isPromise } from "../helpers/index.js";

let utils = null;

import { gitStash, __RewireAPI__ as RewireAPI } from "../../src/sequence-steps";

test.beforeEach( t => {
	utils = {
		log: {
			begin: sinon.spy(),
			end: sinon.spy()
		},
		advise: sinon.spy(),
		exec: sinon.spy( command => new Promise( resolve => resolve( "data" ) ) )
	};
	RewireAPI.__Rewire__( "utils", utils );
} );

test.afterEach( t => {
	RewireAPI.__ResetDependency__( "utils" );
} );

test.serial( "gitStash returns a promise", t => {
	const promise = gitStash( [ git, {} ] );
	t.truthy( isPromise( promise ) );
} );

test.serial( "gitStash calls log.begin", t => {
	return gitStash( [ git, {} ] ).then( () => {
		t.truthy( utils.log.begin.calledWith( "git diff-index HEAD --" ) );
	} );
} );

test.serial( "gitStash calls exec", t => {
	return gitStash( [ git, {} ] ).then( () => {
		t.truthy( utils.exec.calledWith( "git diff-index HEAD --" ) );
	} );
} );

test.serial( "gitStash calls log.end", t => {
	return gitStash( [ git, {} ] ).then( () => {
		t.truthy( utils.log.end.called );
	} );
} );

test.serial( "gitStash calls log.begin for git stash command", t => {
	return gitStash( [ git, {} ] ).then( () => {
		t.truthy( utils.log.begin.calledWith( "git stash" ) );
	} );
} );

test.serial( "gitStash calls exec for git stash command", t => {
	return gitStash( [ git, {} ] ).then( () => {
		t.truthy( utils.exec.calledWith( "git stash" ) );
	} );
} );

test.serial( "gitStash should not call exec for git stash command with no data", t => {
	utils = {
		log: {
			begin: sinon.spy(),
			end: sinon.spy()
		},
		advise: sinon.spy(),
		exec: sinon.spy( command => new Promise( resolve => resolve( ) ) )
	};
	RewireAPI.__Rewire__( "utils", utils );
	return gitStash( [ git, {} ] ).then( () => {
		t.falsy( utils.exec.calledWith( "git stash" ) );
	} );
} );

test.serial( "gitStash gives advise when there are changes to stash", t => {
	return gitStash( [ git, {} ] ).then( () => {
		t.truthy( utils.advise.calledWith( "gitStash" ) );
	} );
} );
