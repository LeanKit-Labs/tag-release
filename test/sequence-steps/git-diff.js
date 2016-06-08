import test from "ava";
import sinon from "sinon";
import { git } from "../helpers/index.js";
import { gitDiff, __RewireAPI__ as RewireAPI } from "../../src/sequence-steps";

let utils = null;

function getUtils( methods = {} ) {
	return Object.assign( {}, {
		log: {
			begin: sinon.spy(),
			end: sinon.spy()
		},
		exec: sinon.spy( command => new Promise( resolve => resolve( "diff" ) ) ),
		prompt: sinon.spy( command => new Promise( resolve => resolve( { proceed: true } ) ) )
	}, methods );
}

test.before( t => {
	RewireAPI.__Rewire__( "logger", { log: sinon.stub() } );
} );

test.beforeEach( t => {
	utils = getUtils();
	RewireAPI.__Rewire__( "utils", utils );
	RewireAPI.__Rewire__( "process", { exit: sinon.stub() } );
} );

test.afterEach( t => {
	RewireAPI.__ResetDependency__( "utils" );
	RewireAPI.__ResetDependency__( "process" );
} );

test.after( t => {
	RewireAPI.__ResetDependency__( "logger" );
} );

test( "gitDiff calls log.begin", t => {
	return gitDiff( [ git, {} ], () => {
		t.truthy( utils.log.begin.called );
	} );
} );

test( "gitDiff calls utils.exec with diff command", t => {
	const GIT_DIFF = "git diff --color CHANGELOG.md package.json";
	return gitDiff( [ git, {} ], () => {
		t.truthy( utils.exec.calledWith( GIT_DIFF ) );
	} );
} );

test( "gitDiff prompts user if diff is acceptable", t => {
	return gitDiff( [ git, {} ], () => {
		t.truthy( utils.prompt.called );
	} );
} );

test( "gitDiff exit's program if user isn't okay with diff", t => {
	utils.prompt = sinon.spy( command => new Promise( resolve => resolve( { proceed: false } ) ) );

	return gitDiff( [ git, {} ], () => {
		t.truthy( process.exit.calledWith( 0 ) );
	} );
} );

test( "gitDiff calls log.end", t => {
	return gitDiff( [ git, {} ], () => {
		t.truthy( utils.log.end.called );
	} );
} );
