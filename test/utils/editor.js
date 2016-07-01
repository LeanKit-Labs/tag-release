import test from "ava";
import utils from "../../src/utils";
import sinon from "sinon";
import { isPromise } from "../helpers/index.js";

let editor = null;
let fs = null;

test.beforeEach( t => {
	editor = sinon.spy( ( arg, callback ) => callback( 0 ) );
	utils.__Rewire__( "editor", editor );
	fs = { unlinkSync: sinon.stub() };
	utils.__Rewire__( "fs", fs );
	if ( !utils.writeFile.isSinonProxy ) {
		sinon.stub( utils, "writeFile" );
		sinon.stub( utils, "readFile" ).returns( "monkeys" );
	}
} );

test.afterEach( t => {
	utils.__ResetDependency__( "editor" );
	utils.__ResetDependency__( "fs" );
	if ( utils.writeFile.isSinonProxy ) {
		utils.writeFile.restore();
		utils.readFile.restore();
	}
} );

test( "editor returns a promise", t => {
	const promise = utils.editor( "monkey" ).then( () => {
		t.truthy( isPromise( promise ) );
	} );
} );

test( "editor writes to a tempFilePath", t => {
	return utils.editor( "monkey" ).then( () => {
		t.truthy( utils.writeFile.calledWith( "./.shortlog", "monkey" ) );
	} );
} );

test( "editor reads tempFilePath after success", t => {
	return utils.editor( "monkey" ).then( () => {
		t.truthy( utils.readFile.calledWith( "./.shortlog" ) );
	} );
} );

test.skip( "editor removes tempFilePath after success", t => {
	return utils.editor( "monkey" ).then( () => {
		t.truthy( fs.unlinkSync.calledWith( "./.shortlog" ) );
	} );
} );

test( "editor resolves after success", t => {
	return utils.editor( "monkey" ).then( data => {
		t.is( data, "monkeys" );
	} );
} );

test( "editor resolves after success", t => {
	editor = sinon.spy( ( arg, callback ) => callback( "error" ) );
	utils.__Rewire__( "editor", editor );
	return utils.editor( "monkey" ).catch( data => {
		t.is( data, "Unable to edit ./.shortlog" );
		utils.__ResetDependency__( "editor" );
	} );
} );
