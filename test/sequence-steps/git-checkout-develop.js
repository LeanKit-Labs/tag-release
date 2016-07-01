import test from "ava";
import sinon from "sinon";
import nodefn from "when/node";
import { git } from "../helpers/index.js";

const lift = sinon.spy( nodefn, "lift" );
const options = { develop: true };
let utils = null;

import { gitCheckoutDevelop, __RewireAPI__ as RewireAPI } from "../../src/sequence-steps";

test.beforeEach( t => {
	utils = {
		log: {
			begin: sinon.spy(),
			end: sinon.spy()
		}
	};
	RewireAPI.__Rewire__( "utils", utils );
	RewireAPI.__Rewire__( "nodefn", { lift } );
} );

test.afterEach( t => {
	RewireAPI.__ResetDependency__( "utils" );
	RewireAPI.__ResetDependency__( "nodefn" );
} );

test( "gitCheckoutDevelop calls log.begin", t => {
	gitCheckoutDevelop( [ git, options ] );
	t.truthy( utils.log.begin.called );
} );

test( "gitCheckoutDevelop calls lift", t => {
	gitCheckoutDevelop( [ git, options ] );
	t.truthy( lift.called );
} );

test( "gitCheckoutDevelop calls git.checkout if develop", t => {
	return gitCheckoutDevelop( [ git, options ], () => {
		t.truthy( git.checkout.calledWith( "devlop" ) );
	} );
} );

test( "gitCheckoutDevelop doesn't log if not develop", t => {
	gitCheckoutDevelop( [ git, { develop: false } ] );
	t.truthy( !utils.log.begin.called );
	t.truthy( !utils.log.end.called );
} );

test( "gitCheckoutDevelop doesn't call git.checkout if not develop", t => {
	git.checkout = sinon.spy( ( arg, callback ) => callback( null, "success" ) );
	gitCheckoutDevelop( [ git, { develop: false } ] );
	t.truthy( !git.checkout.called );
} );

test( "gitCheckoutDevelop calls log.end", t => {
	return gitCheckoutDevelop( [ git, options ] ).then( () => {
		t.truthy( utils.log.end.called );
	} );
} );
