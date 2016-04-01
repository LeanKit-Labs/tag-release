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
const gitCheckoutDevelop = sequenceSteps.gitCheckoutDevelop;

test( "gitCheckoutDevelop calls log.begin", t => {
	gitCheckoutDevelop( [ helpers.git, options ] );
	t.ok( utils.log.begin.called );
} );

test( "gitCheckoutDevelop calls lift", t => {
	gitCheckoutDevelop( [ helpers.git, options ] );
	t.ok( lift.called );
} );

test( "gitCheckoutDevelop calls git.checkout if develop", t => {
	return gitCheckoutDevelop( [ helpers.git, options ], () => {
		t.ok( helpers.git.checkout.calledWith( "devlop" ) );
	} );
} );

test( "gitCheckoutDevelop doesn't call git.checkout if not develop", t => {
	options.develop = false;
	helpers.git.checkout = sinon.spy( ( arg, callback ) => callback( null, "success" ) );
	gitCheckoutDevelop( [ helpers.git, options ] );
	t.ok( !helpers.git.checkout.called );
} );

test( "gitCheckoutDevelop calls log.end", t => {
	gitCheckoutDevelop( [ helpers.git, options ] );
	t.ok( utils.log.end.called );
} );
