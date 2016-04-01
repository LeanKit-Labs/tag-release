import test from "ava";

const utils = {
	log: {
		begin: sinon.spy(),
		end: sinon.spy()
	}
};
const options = {
	versions: {
		newVersion: "1.0.1"
	}
};
const sequenceSteps = proxyquire( "../../src/sequence-steps", {
	"./utils": utils
} );
const gitTag = sequenceSteps.gitTag;

test( "gitTag calls log.begin", t => {
	return gitTag( [ helpers.git, options ], () => {
		t.ok( utils.log.begin.called );
	} );
} );

test( "gitTag calls git.commit", t => {
	return gitTag( [ helpers.git, options ], () => {
		t.ok( git.add.calledWith( "v1.0.1" ) );
	} );
} );

test( "gitTag calls log.end", t => {
	return gitTag( [ helpers.git, options ], () => {
		t.ok( utils.log.end.called );
	} );
} );
