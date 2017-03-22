import test from "ava";
import sinon from "sinon";
import nodefn from "when/node";
import { git } from "../helpers/index.js";

const utils = {
	log: {
		begin: sinon.spy(),
		end: sinon.spy()
	},
	exec: sinon.spy( command => new Promise( resolve => resolve( "data" ) ) )
};
const lift = sinon.spy( nodefn, "lift" );

import { gitPushUpstreamFeatureBranch, __RewireAPI__ as RewireAPI } from "../../src/sequence-steps";

test.beforeEach( t => {
	RewireAPI.__Rewire__( "utils", utils );
	RewireAPI.__Rewire__( "nodefn", { lift } );
} );

test.afterEach( t => {
	RewireAPI.__ResetDependency__( "utils" );
	RewireAPI.__ResetDependency__( "nodefn" );
} );

test( "gitPushUpstreamFeatureBranch calls log.begin", t => {
	return gitPushUpstreamFeatureBranch( [ git, {} ] ).then( () => {
		t.truthy( utils.log.begin.called );
	} );
} );

test( "gitPushUpstreamFeatureBranch calls utils.exec with command", t => {
	const COMMAND = "git push upstream feature-test --tags";
	return gitPushUpstreamFeatureBranch( [ git, { branch: "feature-test" } ] ).then( () => {
		t.truthy( utils.exec.calledWith( COMMAND ) );
	} );
} );

test( "gitPushUpstreamFeatureBranch calls log.end", t => {
	return gitPushUpstreamFeatureBranch( [ git, {} ] ).then( () => {
		t.truthy( utils.log.end.called );
	} );
} );
