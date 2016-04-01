import test from "ava";

function getUtils( methods ) {
	methods = methods || {};
	return Object.assign( {}, {
		log: {
			begin: sinon.spy(),
			end: sinon.spy()
		},
		prompt: sinon.spy( command => new Promise( resolve => resolve( { log: true } ) ) ),
		editor: sinon.spy( command => new Promise( resolve => resolve( " commit " ) ) )
	}, methods );
}
const utils = getUtils();
const sequenceSteps = proxyquire( "../../src/sequence-steps", {
	"./utils": utils
} );
const updateLog = sequenceSteps.updateLog;

test( "updateLog should prompt the user to edit", t => {
	return updateLog( [ helpers.git, {} ] ).then( () => {
		t.ok( utils.prompt.called );
	} );
} );

test( "updateLog launches an editor if user wants to edit", t => {
	return updateLog( [ helpers.git, {} ] ).then( () => {
		t.ok( utils.editor.called );
	} );
} );

test( "updateLog calls log.begin", t => {
	return updateLog( [ helpers.git, {} ] ).then( () => {
		t.ok( utils.log.begin.called );
	} );
} );

test( "updateLog trims data from the editor", t => {
	const options = {};
	return updateLog( [ helpers.git, options ] ).then( () => {
		t.is( options.log, "commit" );
	} );
} );

test( "updateLog calls log.end", t => {
	return updateLog( [ helpers.git, {} ] ).then( () => {
		t.ok( utils.log.end.called );
	} );
} );

test( "updateLog does not launch an editor if user declines", t => {
	const utils = getUtils( {
		prompt: sinon.spy( command => new Promise( resolve => resolve( { log: false } ) ) ),
		editor: sinon.spy( command => new Promise( resolve => resolve( " commit " ) ) )
	} );
	const sequenceSteps = proxyquire( "../../src/sequence-steps", {
		"./utils": utils
	} );
	const updateLog = sequenceSteps.updateLog;
	return updateLog( [ helpers.git, {} ] ).then( () => {
		t.ok( !utils.editor.called );
	} );
} );
