import test from "ava";

const utils = {
	log: {
		begin: sinon.spy(),
		end: sinon.spy()
	},
	add: sinon.spy( command => new Promise( () => {} ) )
};
const sequenceSteps = proxyquire( "../../src/sequence-steps", {
	"./utils": utils
} );
const gitCommit = sequenceSteps.gitCommit;
const options = {
	versions: {
		newVersion: "1.0.1"
	}
};

test( "gitCommit calls log.begin", t => {
	return gitCommit( [ helpers.git, options ], () => {
		t.ok( utils.log.begin.called );
	} );
} );

test( "gitCommit calls git.commit", t => {
	return gitCommit( [ helpers.git, options ], () => {
		t.ok( helpers.git.add.calledWith( "1.0.1" ) );
	} );
} );

test( "gitCommit calls log.end", t => {
	return gitCommit( [ helpers.git, options ], () => {
		t.ok( utils.log.end.called );
	} );
} );
