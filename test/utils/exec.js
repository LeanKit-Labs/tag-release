import test from "ava";

const childProcess = {
	exec: sinon.spy( ( arg, callback ) => callback( null, "success" ) )
};
const utils = proxyquire( "../../src/utils", {
	"child_process": childProcess
} );

test( "exec returns a promise", t => {
	const promise = utils.exec( "command" );
	t.ok( helpers.isPromise( promise ) );
} );

test( "exec calls childProcess.exec", t => {
	utils.exec( "command" );
	t.ok( childProcess.exec.calledWith( "command" ) );
} );

test( "exec resolves if childProcess.exec succeeds", t => {
	return utils.exec( "command" ).then( data => {
		t.is( data, "success" );
	} );
} );

test( "exec rejects if childProcess.exec fails", t => {
	const childProcess = {
		exec: sinon.spy( ( arg, callback ) => callback( "error", null, "fails" ) )
	};
	return utils.exec( "command" ).catch( data => {
		t.is( data, "fails" );
	} );
} );
