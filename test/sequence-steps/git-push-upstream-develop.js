import test from "ava";

const utils = {
	log: {
		begin: sinon.spy(),
		end: sinon.spy()
	}
};
const lift = sinon.spy( nodefn, "lift" );
const options = { develop: true };
const sequenceSteps = proxyquire( "../../src/sequence-steps", {
	"./utils": utils
} );
const gitPushUpstreamDevelop = sequenceSteps.gitPushUpstreamDevelop;

test( "gitPushUpstreamDevelop calls log.begin", t => {
	gitPushUpstreamDevelop( [ helpers.git, options ] );
	t.ok( utils.log.begin.called );
} );

test( "gitPushUpstreamDevelop calls lift", t => {
	gitPushUpstreamDevelop( [ helpers.git, options ] );
	t.ok( lift.called );
} );

test( "gitPushUpstreamDevelop calls git.push if develop", t => {
	return gitPushUpstreamDevelop( [ helpers.git, options ], () => {
		t.ok( helpers.git.push.calledWith( "upstream", "develop" ) );
	} );
} );

test( "gitPushUpstreamDevelop doesn't call git.push if not develop", t => {
	options.develop = false;
	helpers.git.push = sinon.spy( ( arg, callback ) => callback( null, "success" ) );
	gitPushUpstreamDevelop( [ helpers.git, options ] );
	t.ok( !helpers.git.push.called );
} );

// test( "gitPushUpstreamDevelop calls log.end", t => {
// 	options.develop = true;
// 	return gitPushUpstreamDevelop( [ helpers.git, options ] ).then( () => {
// 		t.ok( utils.log.end.called );
// 	} );
// } );
