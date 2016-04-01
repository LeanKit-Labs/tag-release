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
const gitMergeUpstreamDevelop = sequenceSteps.gitMergeUpstreamDevelop;

test( "gitMergeUpstreamDevelop returns a promise", t => {
	const promise = gitMergeUpstreamDevelop( [ helpers.git, { develop: true } ] );
	t.ok( helpers.isPromise( promise ) );
} );

test( "gitMergeUpstreamDevelop returns null if doesn't have develop branch", t => {
	t.is( gitMergeUpstreamDevelop( [ helpers.git, { develop: false } ] ), null );
} );

test( "gitMergeUpstreamDevelop calls log.begin", t => {
	gitMergeUpstreamDevelop( [ helpers.git, { develop: true } ] );
	t.ok( utils.log.begin.called );
} );

test( "gitMergeUpstreamDevelop calls lift", t => {
	gitMergeUpstreamDevelop( [ helpers.git, { develop: true } ] );
	t.ok( lift.called );
} );

test( "gitMergeUpstreamDevelop calls git.checkout", t => {
	gitMergeUpstreamDevelop( [ helpers.git, { develop: true } ] );
	t.ok( helpers.git.merge.calledWith( [ "upstream/develop" ] ) );
} );

test( "gitMergeUpstreamDevelop calls log.end", t => {
	return gitMergeUpstreamDevelop( [ helpers.git, { develop: true } ] ).then( () => {
		t.ok( utils.log.end.called );
	} );
} );
