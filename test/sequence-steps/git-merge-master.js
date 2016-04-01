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
const gitMergeMaster = sequenceSteps.gitMergeMaster;

test( "gitMergeMaster calls log.begin", t => {
	gitMergeMaster( [ helpers.git, options ] );
	t.ok( utils.log.begin.called );
} );

test( "gitMergeMaster calls lift", t => {
	gitMergeMaster( [ helpers.git, options ] );
	t.ok( lift.called );
} );

test( "gitMergeMaster calls git.checkout if develop", t => {
	return gitMergeMaster( [ helpers.git, options ], () => {
		t.ok( helpers.git.merge.calledWith( [ "--ff-only", "master" ] ) );
	} );
} );

test( "gitMergeMaster doesn't call git.checkout if not develop", t => {
	options.develop = false;
	helpers.git.merge = sinon.spy( ( arg, callback ) => callback( null, "success" ) );
	gitMergeMaster( [ helpers.git, options ] );
	t.ok( !helpers.git.checkout.called );
} );

test( "gitMergeMaster calls log.end", t => {
	options.develop = true;
	return gitMergeMaster( [ helpers.git, options ] ).then( () => {
		t.ok( utils.log.end.called );
	} );
} );
