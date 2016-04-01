import test from "ava";
const utils = {
	log: {
		begin: sinon.spy(),
		end: sinon.spy()
	},
	exec: sinon.spy( command => new Promise( resolve => resolve() ) )
};
const sequenceSteps = proxyquire( "../../src/sequence-steps", {
	"./utils": utils
} );
const gitFetchUpstreamMaster = sequenceSteps.gitFetchUpstreamMaster;

test( "gitFetchUpstreamMaster returns a promise", t => {
	const promise = gitFetchUpstreamMaster( [ helpers.git, {} ] );
	t.ok( helpers.isPromise( promise ) );
} );

test( "gitFetchUpstreamMaster calls log.begin", t => {
	gitFetchUpstreamMaster( [ helpers.git, {} ] );
	t.ok( utils.log.begin.called );
} );

test( "gitFetchUpstreamMaster calls exec", t => {
	gitFetchUpstreamMaster( [ helpers.git, {} ] );
	t.ok( utils.exec.calledWith( "git fetch upstream --tags" ) );
} );

test( "gitFetchUpstreamMaster calls log.end", t => {
	return gitFetchUpstreamMaster( [ helpers.git, {} ] ).then( () => {
		t.ok( utils.log.end.called );
	} );
} );
