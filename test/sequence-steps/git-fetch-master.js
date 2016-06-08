import test from "ava";
import sinon from "sinon";
import { git, isPromise } from "../helpers/index.js";

const utils = {
	log: {
		begin: sinon.spy(),
		end: sinon.spy()
	},
	exec: sinon.spy( command => new Promise( resolve => resolve() ) )
};

import { gitFetchUpstreamMaster, __RewireAPI__ as RewireAPI } from "../../src/sequence-steps";

test.beforeEach( t => {
	RewireAPI.__Rewire__( "utils", utils );
} );

test.afterEach( t => {
	RewireAPI.__ResetDependency__( "utils" );
} );

test( "gitFetchUpstreamMaster returns a promise", t => {
	const promise = gitFetchUpstreamMaster( [ git, {} ] );
	t.truthy( isPromise( promise ) );
} );

test( "gitFetchUpstreamMaster calls log.begin", t => {
	gitFetchUpstreamMaster( [ git, {} ] );
	t.truthy( utils.log.begin.called );
} );

test( "gitFetchUpstreamMaster calls exec", t => {
	gitFetchUpstreamMaster( [ git, {} ] );
	t.truthy( utils.exec.calledWith( "git fetch upstream --tags" ) );
} );

test( "gitFetchUpstreamMaster calls log.end", t => {
	return gitFetchUpstreamMaster( [ git, {} ] ).then( () => {
		t.truthy( utils.log.end.called );
	} );
} );
