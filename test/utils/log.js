import test from "ava";

const logUpdate = sinon.stub();
const utils = proxyquire( "../../src/utils", {
	"log-update": logUpdate
} );
logUpdate.done = sinon.stub();

test.beforeEach( t => {
	utils.log.begin( "monkey" );
} );

test( "log begin writes to logUpdate", t => {
	t.ok( logUpdate.calledWith( "monkey ☐" ) );
} );

test( "log end updates logUpdate", t => {
	utils.log.end();
	t.ok( logUpdate.calledWith( "monkey ☑" ) );
} );

test( "log end completes logUpdate", t => {
	utils.log.end();
	t.ok( logUpdate.done.called );
} );
