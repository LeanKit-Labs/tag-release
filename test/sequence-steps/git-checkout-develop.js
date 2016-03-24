import test from "ava";
import sinon from "sinon";
import nodefn from "when/node";
import { git } from "../helpers/index.js";

const utils = {
	log: {
		begin: sinon.spy(),
		end: sinon.spy()
	}
};
const lift = sinon.spy( nodefn, "lift" );
const options = { develop: true };

import { gitCheckoutDevelop, __RewireAPI__ as RewireAPI } from "../../src/sequence-steps";

test.beforeEach( t => {
	RewireAPI.__Rewire__( "utils", utils );
	RewireAPI.__Rewire__( "nodefn", { lift } );
} );

test.afterEach( t => {
	RewireAPI.__ResetDependency__( "utils" );
	RewireAPI.__ResetDependency__( "nodefn" );
} );

test( "gitCheckoutDevelop calls log.begin", t => {
	gitCheckoutDevelop( [ git, options ] );
	t.ok( utils.log.begin.called );
} );

test( "gitCheckoutDevelop calls lift", t => {
	gitCheckoutDevelop( [ git, options ] );
	t.ok( lift.called );
} );

test( "gitCheckoutDevelop calls git.checkout if develop", t => {
	return gitCheckoutDevelop( [ git, options ], () => {
		t.ok( git.checkout.calledWith( "devlop" ) );
	} );
} );

test( "gitCheckoutDevelop doesn't call git.checkout if not develop", t => {
	options.develop = false;
	git.checkout = sinon.spy( ( arg, callback ) => callback( null, "success" ) );
	gitCheckoutDevelop( [ git, options ] );
	t.ok( !git.checkout.called );
} );

test( "gitCheckoutDevelop calls log.end", t => {
	gitCheckoutDevelop( [ git, options ] );
	t.ok( utils.log.end.called );
} );
