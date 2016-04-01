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

import { gitMergeUpstreamDevelop, __RewireAPI__ as RewireAPI } from "../../src/sequence-steps";

test.beforeEach( t => {
	RewireAPI.__Rewire__( "utils", utils );
	RewireAPI.__Rewire__( "nodefn", { lift } );
} );

test.afterEach( t => {
	RewireAPI.__ResetDependency__( "utils" );
	RewireAPI.__ResetDependency__( "nodefn" );
} );

test( "gitMergeUpstreamDevelop returns a promise", t => {
	const promise = gitMergeUpstreamDevelop( [ git, { develop: true } ] );
	t.ok( isPromise( promise ) );
} );

test( "gitMergeUpstreamDevelop returns null if doesn't have develop branch", t => {
	t.is( gitMergeUpstreamDevelop( [ git, { develop: false } ] ), null );
} );

test( "gitMergeUpstreamDevelop calls log.begin", t => {
	gitMergeUpstreamDevelop( [ git, { develop: true } ] );
	t.ok( utils.log.begin.called );
} );

test( "gitMergeUpstreamDevelop calls lift", t => {
	gitMergeUpstreamDevelop( [ git, { develop: true } ] );
	t.ok( lift.called );
} );

test( "gitMergeUpstreamDevelop calls git.checkout", t => {
	gitMergeUpstreamDevelop( [ git, { develop: true } ] );
	t.ok( git.merge.calledWith( [ "upstream/develop" ] ) );
} );

test( "gitMergeUpstreamDevelop calls log.end", t => {
	return gitMergeUpstreamDevelop( [ git, { develop: true } ] ).then( () => {
		t.ok( utils.log.end.called );
	} );
} );
