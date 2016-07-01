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

import { gitPushUpstreamDevelop, __RewireAPI__ as RewireAPI } from "../../src/sequence-steps";

test.beforeEach( t => {
	RewireAPI.__Rewire__( "utils", utils );
	RewireAPI.__Rewire__( "nodefn", { lift } );
} );

test.afterEach( t => {
	RewireAPI.__ResetDependency__( "utils" );
	RewireAPI.__ResetDependency__( "nodefn" );
} );

test.serial( "gitPushUpstreamDevelop calls log.begin", t => {
	gitPushUpstreamDevelop( [ git, options ] );
	t.truthy( utils.log.begin.called );
} );

test.serial( "gitPushUpstreamDevelop calls lift", t => {
	gitPushUpstreamDevelop( [ git, options ] );
	t.truthy( lift.called );
} );

test.serial( "gitPushUpstreamDevelop calls git.push if develop", t => {
	return gitPushUpstreamDevelop( [ git, options ], () => {
		t.truthy( git.push.calledWith( "upstream", "develop" ) );
	} );
} );

test.serial( "gitPushUpstreamDevelop doesn't call git.push if not develop", t => {
	options.develop = false;
	git.push = sinon.spy( ( arg, callback ) => callback( null, "success" ) );
	gitPushUpstreamDevelop( [ git, options ] );
	t.truthy( !git.push.called );
} );

// test( "gitPushUpstreamDevelop calls log.end", t => {
// 	options.develop = true;
// 	return gitPushUpstreamDevelop( [ git, options ] ).then( () => {
// 		t.truthy( utils.log.end.called );
// 	} );
// } );
