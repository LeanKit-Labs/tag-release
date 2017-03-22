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
	advise: sinon.spy(),
	exec: sinon.spy( command => new Promise( resolve => resolve( "diff" ) ) )
};
const lift = sinon.spy( nodefn, "lift" );

import { gitMergeUpstreamFeatureBranch, __RewireAPI__ as RewireAPI } from "../../src/sequence-steps";

test.beforeEach( t => {
	RewireAPI.__Rewire__( "utils", utils );
	RewireAPI.__Rewire__( "nodefn", { lift } );
} );

test.afterEach( t => {
	git.merge.reset();
	RewireAPI.__ResetDependency__( "utils" );
	RewireAPI.__ResetDependency__( "nodefn" );
} );

test.serial( "gitMergeUpstreamFeatureBranch returns a promise", t => {
	const promise = gitMergeUpstreamFeatureBranch( [ git, {} ] );
	t.truthy( isPromise( promise ) );
} );

test.serial( "gitMergeUpstreamFeatureBranch calls log.begin", t => {
	gitMergeUpstreamFeatureBranch( [ git, {} ] );
	t.truthy( utils.log.begin.called );
} );

test.serial( "gitMergeUpstreamFeatureBranch calls lift", t => {
	gitMergeUpstreamFeatureBranch( [ git, {} ] );
	t.truthy( lift.called );
} );

test.serial( "gitMergeUpstreamFeatureBranch calls git.merge", t => {
	gitMergeUpstreamFeatureBranch( [ git, { branch: "feature-branch" } ] );
	t.truthy( git.merge.calledWith( [ "--ff-only", "upstream/feature-branch" ] ) );
} );

test.serial( "gitMergeUpstreamFeatureBranch calls log.end", t => {
	return gitMergeUpstreamFeatureBranch( [ git, {} ] ).then( () => {
		t.truthy( utils.log.end.called );
	} );
} );

test.serial( "gitMergeUpstreamFeatureBranch gives advise when git.merge fails", t => {
	git.merge = sinon.stub().yields( "error", "bummer" );
	return gitMergeUpstreamFeatureBranch( [ git, {} ] ).catch( () => {
		t.truthy( utils.advise.calledWith( "gitMergeUpstreamBranch" ) );
	} );
} );
