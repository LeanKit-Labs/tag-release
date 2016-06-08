import test from "ava";
import utils from "../../src/utils";
import sinon from "sinon";

let logUpdate = null;

test.beforeEach( t => {
	logUpdate = sinon.stub();
	logUpdate.done = sinon.stub();
	utils.__Rewire__( "logUpdate", logUpdate );
	utils.log.begin( "monkey" );
} );

test.afterEach( t => {
	utils.__ResetDependency__( "logUpdate" );
} );

test( "log begin writes to logUpdate", t => {
	t.truthy( logUpdate.calledWith( "monkey ☐" ) );
} );

test( "log end updates logUpdate", t => {
	utils.log.end();
	t.truthy( logUpdate.calledWith( "monkey ☑" ) );
} );

test( "log end completes logUpdate", t => {
	utils.log.end();
	t.truthy( logUpdate.done.called );
} );
