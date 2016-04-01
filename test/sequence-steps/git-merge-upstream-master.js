import test from "ava";

const utils = {
	log: {
		begin: sinon.spy(),
		end: sinon.spy()
	},
	exec: sinon.spy( command => new Promise( () => {} ) )
};
const lift = sinon.spy( nodefn, "lift" );
const sequenceSteps = proxyquire( "../../src/sequence-steps", {
	"./utils": utils
} );
const gitMergeUpstreamMaster = sequenceSteps.gitMergeUpstreamMaster;

test( "gitMergeUpstreamMaster returns a promise", t => {
	const promise = gitMergeUpstreamMaster( [ helpers.git, {} ] );
	t.ok( helpers.isPromise( promise ) );
} );

test( "gitMergeUpstreamMaster calls log.begin", t => {
	gitMergeUpstreamMaster( [ helpers.git, {} ] );
	t.ok( utils.log.begin.called );
} );

test( "gitMergeUpstreamMaster calls lift", t => {
	gitMergeUpstreamMaster( [ helpers.git, {} ] );
	t.ok( lift.called );
} );

test( "gitMergeUpstreamMaster calls git.checkout", t => {
	gitMergeUpstreamMaster( [ helpers.git, {} ] );
	t.ok( helpers.git.merge.calledWith( [ "--ff-only", "upstream/master" ] ) );
} );

test( "gitMergeUpstreamMaster calls log.end", t => {
	return gitMergeUpstreamMaster( [ helpers.git, {} ] ).then( () => {
		t.ok( utils.log.end.called );
	} );
} );
