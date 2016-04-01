import test from "ava";
import sinon from "sinon";
import { git } from "../helpers/index.js";
import { gitCommit, __RewireAPI__ as RewireAPI } from "../../src/sequence-steps";

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
		},
		add: sinon.spy( command => new Promise( () => {} ) )
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

test( "gitCommit calls log.begin", t => {
	return gitCommit( [ git, options ], () => {
		t.ok( utils.log.begin.called );
	} );
} );

test( "gitCommit calls git.commit", t => {
	return gitCommit( [ git, options ], () => {
		t.ok( git.add.calledWith( "1.0.1" ) );
	} );
} );

test( "gitCommit calls log.end", t => {
	return gitCommit( [ git, options ], () => {
		t.ok( utils.log.end.called );
	} );
} );
