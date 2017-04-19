import test from "ava";
import sinon from "sinon";
import "sinon-as-promised";
import { git, isPromise } from "../helpers/index.js";

const utils = {
	log: {
		begin: sinon.spy(),
		end: sinon.spy()
	},
	advise: sinon.spy(),
	exec: sinon.spy( command => new Promise( resolve => resolve( "\n" ) ) )
};
const options = { branch: "master" };

import { verifyMasterBranch, __RewireAPI__ as RewireAPI } from "../../src/sequence-steps";

test.beforeEach( t => {
	RewireAPI.__Rewire__( "utils", utils );
} );

test.afterEach( t => {
	RewireAPI.__ResetDependency__( "utils" );
} );

test.serial( "verifyMasterBranch returns a promise", t => {
	const promise = verifyMasterBranch( [ git, options ] );
	t.truthy( isPromise( promise ) );
} );

test.serial( "verifyMasterBranch calls log.begin", t => {
	return verifyMasterBranch( [ git, options ] ).then( () => {
		t.truthy( utils.log.begin.calledWith( "git branch --list master" ) );
	} );
} );

test.serial( "verifyMasterBranch calls exec", t => {
	return verifyMasterBranch( [ git, options ] ).then( () => {
		t.truthy( utils.exec.calledWith( "git branch --list master" ) );
	} );
} );

test.serial( "verifyMasterBranch calls log.begin when branch doesn't exist", t => {
	return verifyMasterBranch( [ git, options ] ).then( () => {
		t.truthy( utils.log.begin.calledWith( "git branch master upstream/master" ) );
	} );
} );

test.serial( "verifyMasterBranch calls exec when branch doesn't exist", t => {
	return verifyMasterBranch( [ git, options ] ).then( () => {
		t.truthy( utils.exec.calledWith( "git branch master upstream/master" ) );
	} );
} );

test.serial( "verifyMasterBranch gives advise when branching fails", t => {
	const execStub = sinon.stub();
	execStub.onCall( 0 ).returns( new Promise( resolve => resolve( "\n" ) ) );
	execStub.onCall( 1 ).returns( Promise.reject() );
	const myUtils = {
		log: {
			begin: sinon.spy(),
			end: sinon.spy()
		},
		advise: sinon.spy(),
		exec: execStub
	};
	RewireAPI.__Rewire__( "utils", myUtils );
	return verifyMasterBranch( [ git, {} ] ).then( () => {
		t.truthy( myUtils.advise.calledWith( "gitUpstream" ) );
	} );
} );

test.serial( "verifyMasterBranch should not call exec when branch exists", t => {
	const myUtils = {
		log: {
			begin: sinon.spy(),
			end: sinon.spy()
		},
		advise: sinon.spy(),
		exec: sinon.spy( command => new Promise( resolve => resolve( "master" ) ) )
	};
	RewireAPI.__Rewire__( "utils", myUtils );
	return verifyMasterBranch( [ git, {} ] ).then( () => {
		t.falsy( myUtils.exec.calledWith( "git branch master upstream/master" ) );
	} );
} );
