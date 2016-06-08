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

import { gitMergeUpstreamMaster, __RewireAPI__ as RewireAPI } from "../../src/sequence-steps";

test.beforeEach( t => {
	RewireAPI.__Rewire__( "utils", utils );
	RewireAPI.__Rewire__( "nodefn", { lift } );
} );

test.afterEach( t => {
	RewireAPI.__ResetDependency__( "utils" );
	RewireAPI.__ResetDependency__( "nodefn" );
} );

test( "gitMergeUpstreamMaster returns a promise", t => {
	const promise = gitMergeUpstreamMaster( [ git, {} ] );
	t.truthy( isPromise( promise ) );
} );

test( "gitMergeUpstreamMaster calls log.begin", t => {
	gitMergeUpstreamMaster( [ git, {} ] );
	t.truthy( utils.log.begin.called );
} );

test( "gitMergeUpstreamMaster calls lift", t => {
	gitMergeUpstreamMaster( [ git, {} ] );
	t.truthy( lift.called );
} );

test( "gitMergeUpstreamMaster calls git.checkout", t => {
	gitMergeUpstreamMaster( [ git, {} ] );
	t.truthy( git.merge.calledWith( [ "--ff-only", "upstream/master" ] ) );
} );

test( "gitMergeUpstreamMaster calls log.end", t => {
	return gitMergeUpstreamMaster( [ git, {} ] ).then( () => {
		t.truthy( utils.log.end.called );
	} );
} );
