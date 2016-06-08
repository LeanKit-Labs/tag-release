import test from "ava";
import sinon from "sinon";
import { git } from "../helpers/index.js";
import { gitTag, __RewireAPI__ as RewireAPI } from "../../src/sequence-steps";

const options = {
	versions: {
		newVersion: "1.0.1"
	}
};

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

test( "gitTag calls log.begin", t => {
	return gitTag( [ git, options ], () => {
		t.truthy( utils.log.begin.called );
	} );
} );

test( "gitTag calls git.commit", t => {
	return gitTag( [ git, options ], () => {
		t.truthy( git.add.calledWith( "v1.0.1" ) );
	} );
} );

test( "gitTag calls log.end", t => {
	return gitTag( [ git, options ], () => {
		t.truthy( utils.log.end.called );
	} );
} );
