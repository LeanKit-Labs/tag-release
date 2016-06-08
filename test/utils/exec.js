import test from "ava";
import utils from "../../src/utils";
import sinon from "sinon";
import { isPromise } from "../helpers/index.js";

let childProcess = null;

test.beforeEach( t => {
	childProcess = {
		exec: sinon.spy( ( arg, callback ) => callback( null, "success" ) )
	};
	utils.__Rewire__( "childProcess", childProcess );
} );

test.afterEach( t => {
	utils.__ResetDependency__( "childProcess" );
} );

test( "exec returns a promise", t => {
	const promise = utils.exec( "command" );
	t.truthy( isPromise( promise ) );
} );

test( "exec calls childProcess.exec", t => {
	utils.exec( "command" );
	t.truthy( childProcess.exec.calledWith( "command" ) );
} );

test( "exec resolves if childProcess.exec succeeds", t => {
	return utils.exec( "command" ).then( data => {
		t.is( data, "success" );
	} );
} );

test( "exec rejects if childProcess.exec fails", t => {
	childProcess = {
		exec: sinon.spy( ( arg, callback ) =>
			callback( "error", null, "fails" )
		)
	};
	utils.__Rewire__( "childProcess", childProcess );
	return utils.exec( "command" ).catch( data => {
		t.is( data, "error" );
	} );
} );
