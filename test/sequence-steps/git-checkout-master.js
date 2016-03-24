import test from "ava";
import sinon from "sinon";
import nodefn from "when/node";
import { git, isPromise } from "../helpers/index.js";

const utils = {
	log: {
		begin: sinon.spy(),
		end: sinon.spy()
	},
	exec: sinon.spy( command => new Promise( () => {} ) )
};
const lift = sinon.spy( nodefn, "lift" );

import { gitCheckoutMaster, __RewireAPI__ as RewireAPI } from "../../src/sequence-steps";

test.beforeEach( t => {
	RewireAPI.__Rewire__( "utils", utils );
	RewireAPI.__Rewire__( "nodefn", { lift } );
} );

test.afterEach( t => {
	RewireAPI.__ResetDependency__( "utils" );
	RewireAPI.__ResetDependency__( "nodefn" );
} );

test( "gitCheckoutMaster returns a promise", t => {
	const promise = gitCheckoutMaster( [ git, {} ] );
	t.ok( isPromise( promise ) );
} );

test( "gitCheckoutMaster calls log.begin", t => {
	gitCheckoutMaster( [ git, {} ] );
	t.ok( utils.log.begin.called );
} );

test( "gitCheckoutMaster calls lift", t => {
	gitCheckoutMaster( [ git, {} ] );
	t.ok( lift.called );
} );

test( "gitCheckoutMaster calls git.checkout", t => {
	gitCheckoutMaster( [ git, {} ] );
	t.ok( git.checkout.calledWith( "master" ) );
} );

test( "gitCheckoutMaster calls log.end", t => {
	return gitCheckoutMaster( [ git, {} ] ).then( () => {
		t.ok( utils.log.end.called );
	} );
} );
