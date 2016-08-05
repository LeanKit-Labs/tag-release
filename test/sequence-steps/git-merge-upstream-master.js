import test from "ava";
import sinon from "sinon";
import "sinon-as-promised";
import nodefn from "when/node";
import { git, isPromise } from "../helpers/index.js";

const utils = {
	log: {
		begin: sinon.spy(),
		end: sinon.spy()
	},
	advise: sinon.spy()
};
const lift = sinon.spy( nodefn, "lift" );
// const lift = sinon.stub().returns( () => Promise.resolve() );

import { gitMergeUpstreamMaster, __RewireAPI__ as RewireAPI } from "../../src/sequence-steps";

test.beforeEach( t => {
	RewireAPI.__Rewire__( "utils", utils );
	RewireAPI.__Rewire__( "nodefn", { lift } );
} );

test.afterEach( t => {
	git.merge.reset();
	RewireAPI.__ResetDependency__( "utils" );
	RewireAPI.__ResetDependency__( "nodefn" );
} );

test.serial( "gitMergeUpstreamMaster returns a promise", t => {
	const promise = gitMergeUpstreamMaster( [ git, {} ] );
	t.truthy( isPromise( promise ) );
} );

test.serial( "gitMergeUpstreamMaster calls log.begin", t => {
	gitMergeUpstreamMaster( [ git, {} ] );
	t.truthy( utils.log.begin.called );
} );

test.serial( "gitMergeUpstreamMaster calls lift", t => {
	gitMergeUpstreamMaster( [ git, {} ] );
	t.truthy( lift.called );
} );

test.serial( "gitMergeUpstreamMaster calls git.checkout", t => {
	gitMergeUpstreamMaster( [ git, {} ] );
	t.truthy( git.merge.calledWith( [ "--ff-only", "upstream/master" ] ) );
} );

test.serial( "gitMergeUpstreamMaster calls log.end", t => {
	return gitMergeUpstreamMaster( [ git, {} ] ).then( () => {
		t.truthy( utils.log.end.called );
	} );
} );

test.serial( "gitMergeUpstreamMaster gives advise when git.merge fails", t => {
	git.merge = sinon.stub().yields( "error", "bummer" );
	return gitMergeUpstreamMaster( [ git, {} ] ).catch( () => {
		t.truthy( utils.advise.called );
	} );
} );
