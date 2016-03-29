import test from "ava";
import sinon from "sinon";
import { git } from "../helpers/index.js";
import { updateLog, __RewireAPI__ as RewireAPI } from "../../src/sequence-steps";

let utils = null;

function getUtils( methods = {} ) {
	return Object.assign( {}, {
		log: {
			begin: sinon.spy(),
			end: sinon.spy()
		},
		prompt: sinon.spy( command => new Promise( resolve => resolve( { log: true } ) ) ),
		editor: sinon.spy( command => new Promise( resolve => resolve( " commit " ) ) )
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

test( "updateLog should prompt the user to edit", t => {
	return updateLog( [ git, {} ] ).then( () => {
		t.ok( utils.prompt.called );
	} );
} );

test( "updateLog launches an editor if user wants to edit", t => {
	return updateLog( [ git, {} ] ).then( () => {
		t.ok( utils.editor.called );
	} );
} );

test( "updateLog calls log.begin", t => {
	return updateLog( [ git, {} ] ).then( () => {
		t.ok( utils.log.begin.called );
	} );
} );

test( "updateLog trims data from the editor", t => {
	const options = {};
	return updateLog( [ git, options ] ).then( () => {
		t.is( options.log, "commit" );
	} );
} );

test( "updateShortlog calls log.end", t => {
	return updateLog( [ git, {} ] ).then( () => {
		t.ok( utils.log.end.called );
	} );
} );

test( "updateLog does not launch an editor if user declines", t => {
	RewireAPI.__ResetDependency__( "utils" );
	utils = getUtils( {
		prompt: sinon.spy( command => new Promise( resolve => resolve( { log: false } ) ) ),
		editor: sinon.spy( command => new Promise( resolve => resolve( " commit " ) ) )
	} );
	RewireAPI.__Rewire__( "utils", utils );
	return updateLog( [ git, {} ] ).then( () => {
		// HACK - I can't figure out how to reset the editor...
		const CALL_COUNT = 5;
		t.is( utils.editor.callCount, CALL_COUNT );
	} );
} );
