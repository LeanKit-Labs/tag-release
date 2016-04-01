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
const gitAdd = sequenceSteps.gitAdd;

test( "gitAdd calls log.begin", t => {
	return gitAdd( [ helpers.git, {} ], () => {
		t.ok( utils.log.begin.called );
	} );
} );

test( "gitAdd calls git.add", t => {
	return gitAdd( [ helpers.git, {} ], () => {
		t.ok( helpers.git.add.calledWith( [ "CHANGELOG.md", "package.json" ] ) );
	} );
} );

test( "gitAdd calls log.end", t => {
	return gitAdd( [ helpers.git, {} ], () => {
		t.ok( utils.log.end.called );
	} );
} );
