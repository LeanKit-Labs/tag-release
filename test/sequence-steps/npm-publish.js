import test from "ava";

const utils = {
	log: {
		begin: sinon.spy(),
		end: sinon.spy()
	},
	prompt: sinon.spy( command => new Promise( resolve => resolve( { publish: true } ) ) ),
	exec: sinon.spy( command => new Promise( resolve => resolve( "data" ) ) )
};
const lift = sinon.spy( nodefn, "lift" );
const sequenceSteps = proxyquire( "../../src/sequence-steps", {
	"./utils": utils
} );
const npmPublish = sequenceSteps.npmPublish;

test( "npmPublish calls log.begin", t => {
	return npmPublish( [ helpers.git, {} ], () => {
		t.ok( utils.log.begin.called );
	} );
} );

test( "npmPublish publishes if confirms prompt", t => {
	const COMMAND = "npm publish";
	return npmPublish( [ helpers.git, {} ], () => {
		t.ok( utils.exec.calledWith( COMMAND ) );
	} );
} );

test( "npmPublish doesn't publish if denies prompt", t => {
	utils.prompt = sinon.spy( command => new Promise( resolve => resolve( { publish: false } ) ) );
	return npmPublish( [ helpers.git, {} ], () => {
		t.ok( !utils.exec.called );
	} );
} );

test( "npmPublish calls log.end", t => {
	return npmPublish( [ helpers.git, {} ] ).then( () => {
		t.ok( utils.log.end.called );
	} );
} );
