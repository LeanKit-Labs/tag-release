import test from "ava";

const editor = sinon.stub().yields( 0 );
const fs = {
	unlinkSync: sinon.stub()
};
const utils = proxyquire( "../../src/utils", {
	"editor": editor,
	"fs": fs
} );

sinon.stub( utils, "writeFile" );
sinon.stub( utils, "readFile" ).returns( "monkeys" );

test( "editor returns a promise", t => {
	const promise = utils.editor( "monkey" ).then( () => {
		t.ok( helpers.isPromise( promise ) );
	} );
} );

test( "editor writes to a tempFilePath", t => {
	return utils.editor( "monkey" ).then( () => {
		t.ok( utils.writeFile.calledWith( "./.shortlog", "monkey" ) );
	} );
} );

test( "editor reads tempFilePath after success", t => {
	return utils.editor( "monkey" ).then( () => {
		t.ok( utils.readFile.calledWith( "./.shortlog" ) );
	} );
} );

test( "editor removes tempFilePath after success", t => {
	return utils.editor( "monkey" ).then( () => {
		t.ok( fs.unlinkSync.calledWith( "./.shortlog" ) );
	} );
} );

test( "editor resolves after success", t => {
	return utils.editor( "monkey" ).then( data => {
		t.is( data, "monkeys" );
	} );
} );

test( "editor resolves after error", t => {
	const utils = proxyquire( "../../src/utils", {
		"editor": sinon.stub().yields( "error" )
	} );
	return utils.editor( "monkey" ).catch( data => {
		t.is( data, "Unable to edit ./.shortlog" );
	} );
} );
