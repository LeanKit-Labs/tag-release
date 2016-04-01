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
const gitCheckoutMaster = sequenceSteps.gitCheckoutMaster;

test( "gitCheckoutMaster returns a promise", t => {
	const promise = gitCheckoutMaster( [ helpers.git, {} ] );
	t.ok( helpers.isPromise( promise ) );
} );

test( "gitCheckoutMaster calls log.begin", t => {
	gitCheckoutMaster( [ helpers.git, {} ] );
	t.ok( utils.log.begin.called );
} );

test( "gitCheckoutMaster calls lift", t => {
	gitCheckoutMaster( [ helpers.git, {} ] );
	t.ok( lift.called );
} );

test( "gitCheckoutMaster calls git.checkout", t => {
	gitCheckoutMaster( [ helpers.git, {} ] );
	t.ok( helpers.git.checkout.calledWith( "master" ) );
} );

test( "gitCheckoutMaster calls log.end", t => {
	return gitCheckoutMaster( [ helpers.git, {} ] ).then( () => {
		t.ok( utils.log.end.called );
	} );
} );
