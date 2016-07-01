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

import { gitPushUpstreamMaster, __RewireAPI__ as RewireAPI } from "../../src/sequence-steps";

test.beforeEach( t => {
	RewireAPI.__Rewire__( "utils", utils );
	RewireAPI.__Rewire__( "nodefn", { lift } );
} );

test.afterEach( t => {
	RewireAPI.__ResetDependency__( "utils" );
	RewireAPI.__ResetDependency__( "nodefn" );
} );

test( "gitPushUpstreamMaster calls log.begin", t => {
	return gitPushUpstreamMaster( [ git, {} ], () => {
		t.truthy( utils.log.begin.called );
	} );
} );

test( "gitPushUpstreamMaster calls utils.exec with command", t => {
	const COMMAND = "git push upstream master --tags";
	return gitPushUpstreamMaster( [ git, {} ], () => {
		t.truthy( utils.exec.calledWith( COMMAND ) );
	} );
} );

test( "gitPushUpstreamMaster calls log.end", t => {
	return gitPushUpstreamMaster( [ git, {} ] ).then( () => {
		t.truthy( utils.log.end.called );
	} );
} );
