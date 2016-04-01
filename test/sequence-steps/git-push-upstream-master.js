import test from "ava";

const utils = {
	log: {
		begin: sinon.spy(),
		end: sinon.spy()
	},
	exec: sinon.spy( command => new Promise( resolve => resolve( "data" ) ) )
};
const lift = sinon.spy( nodefn, "lift" );
const sequenceSteps = proxyquire( "../../src/sequence-steps", {
	"./utils": utils
} );
const gitPushUpstreamMaster = sequenceSteps.gitPushUpstreamMaster;

test( "gitPushUpstreamMaster calls log.begin", t => {
	return gitPushUpstreamMaster( [ helpers.git, {} ], () => {
		t.ok( utils.log.begin.called );
	} );
} );

test( "gitPushUpstreamMaster calls utils.exec with command", t => {
	const COMMAND = "git push upstream master --tags";
	return gitPushUpstreamMaster( [ helpers.git, {} ], () => {
		t.ok( utils.exec.calledWith( COMMAND ) );
	} );
} );

test( "gitPushUpstreamMaster calls log.end", t => {
	return gitPushUpstreamMaster( [ helpers.git, {} ] ).then( () => {
		t.ok( utils.log.end.called );
	} );
} );
