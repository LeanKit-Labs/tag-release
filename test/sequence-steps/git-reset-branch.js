import test from "ava";
import sinon from "sinon";
import nodefn from "when/node";
import { git } from "../helpers/index.js";

const utils = {
	log: {
		begin: sinon.spy(),
		end: sinon.spy()
	},
	advise: sinon.spy(),
	exec: sinon.spy( command => new Promise( resolve => resolve() ) )
};
const lift = sinon.spy( nodefn, "lift" );
const options = { branch: "develop" };

import { gitResetBranch, __RewireAPI__ as RewireAPI } from "../../src/sequence-steps";

test.beforeEach( t => {
	RewireAPI.__Rewire__( "utils", utils );
	RewireAPI.__Rewire__( "nodefn", { lift } );
} );

test.afterEach( t => {
	RewireAPI.__ResetDependency__( "utils" );
	RewireAPI.__ResetDependency__( "nodefn" );
} );

test.serial( "gitResetBranch calls log.begin", t => {
	return gitResetBranch( [ git, options ] ).then( () => {
		t.truthy( utils.log.begin.called );
	} );
} );

test.serial( "gitResetBranch calls exec", t => {
	return gitResetBranch( [ git, options ] ).then( () => {
		t.truthy( utils.exec.calledWith( "git reset --hard upstream/develop" ) );
	} );
} );

test.serial( "gitResetBranch calls log.end", t => {
	return gitResetBranch( [ git, options ] ).then( () => {
		t.truthy( utils.log.end.called );
	} );
} );

test.serial( "gitResetBranch gives advise when utils.exec fails", t => {
	const myUtils = {
		log: {
			begin: sinon.spy(),
			end: sinon.spy()
		},
		exec: sinon.spy( command => Promise.reject() ),
		advise: sinon.spy()
	};
	RewireAPI.__Rewire__( "utils", myUtils );
	return gitResetBranch( [ git, {} ] ).then( () => {
		t.truthy( myUtils.advise.calledWith( "gitUpstream" ) );
	} );
} );
