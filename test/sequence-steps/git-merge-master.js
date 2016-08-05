import test from "ava";
import sinon from "sinon";
import nodefn from "when/node";
import { git } from "../helpers/index.js";

const utils = {
	log: {
		begin: sinon.spy(),
		end: sinon.spy()
	},
	advise: sinon.spy()
};
const lift = sinon.spy( nodefn, "lift" );
const options = { develop: true };

import { gitMergeMaster, __RewireAPI__ as RewireAPI } from "../../src/sequence-steps";

test.beforeEach( t => {
	RewireAPI.__Rewire__( "utils", utils );
	RewireAPI.__Rewire__( "nodefn", { lift } );
} );

test.afterEach( t => {
	RewireAPI.__ResetDependency__( "utils" );
	RewireAPI.__ResetDependency__( "nodefn" );
} );

test( "gitMergeMaster calls log.begin", t => {
	gitMergeMaster( [ git, options ] );
	t.truthy( utils.log.begin.called );
} );

test( "gitMergeMaster calls lift", t => {
	gitMergeMaster( [ git, options ] );
	t.truthy( lift.called );
} );

test( "gitMergeMaster calls git.checkout if develop", t => {
	return gitMergeMaster( [ git, options ], () => {
		t.truthy( git.merge.calledWith( [ "--ff-only", "master" ] ) );
	} );
} );

test( "gitMergeMaster doesn't call git.checkout if not develop", t => {
	options.develop = false;
	git.merge = sinon.spy( ( arg, callback ) => callback( null, "success" ) );
	gitMergeMaster( [ git, options ] );
	t.truthy( !git.checkout.called );
} );

test( "gitMergeMaster calls log.end", t => {
	options.develop = true;
	return gitMergeMaster( [ git, options ] ).then( () => {
		t.truthy( utils.log.end.called );
	} );
} );

test( "gitMergeMaster gives advise when git.checked fails", t => {
	git.merge = sinon.stub().yields( "error", "bummer" );
	return gitMergeMaster( [ git, options ] ).then( () => {
		t.truthy( utils.advise.called );
	} );
} );
