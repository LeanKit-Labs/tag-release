import test from "ava";
import sinon from "sinon";
import { git } from "../helpers/index.js";
import { gitPushOriginMaster, __RewireAPI__ as RewireAPI } from "../../src/sequence-steps";

let utils = null;

function getUtils( methods = {} ) {
	return Object.assign( {}, {
		log: {
			begin: sinon.spy(),
			end: sinon.spy()
		}
	}, methods );
}

test.beforeEach( t => {
	RewireAPI.__Rewire__( "console", { log: sinon.stub() } );
	utils = getUtils();
	RewireAPI.__Rewire__( "utils", utils );
} );

test.afterEach( t => {
	RewireAPI.__ResetDependency__( "console" );
	RewireAPI.__ResetDependency__( "utils" );
} );

test( "gitPushOriginMaster calls log.begin", t => {
	return gitPushOriginMaster( [ git, {} ], () => {
		t.ok( utils.log.begin.called );
	} );
} );

test( "gitPushOriginMaster calls git.push", t => {
	return gitPushOriginMaster( [ git, {} ], () => {
		t.ok( git.push.calledWith( "origin", "master" ) );
	} );
} );

test( "gitPushOriginMaster calls log.end", t => {
	return gitPushOriginMaster( [ git, {} ], () => {
		t.ok( utils.log.end.called );
	} );
} );
