import test from "ava";
import sinon from "sinon";
import { git } from "../helpers/index.js";
import { gitAdd, __RewireAPI__ as RewireAPI } from "../../src/sequence-steps";

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

test( "gitAdd calls log.begin", t => {
	return gitAdd( [ git, {} ], () => {
		t.ok( utils.log.begin.called );
	} );
} );

test( "gitAdd calls git.add", t => {
	return gitAdd( [ git, {} ], () => {
		t.ok( git.add.calledWith( [ "CHANGELOG.md", "package.json" ] ) );
	} );
} );

test( "gitAdd calls log.end", t => {
	return gitAdd( [ git, {} ], () => {
		t.ok( utils.log.end.called );
	} );
} );
