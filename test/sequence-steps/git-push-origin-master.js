import test from "ava";

const utils = {
	log: {
		begin: sinon.spy(),
		end: sinon.spy()
	}
};
const sequenceSteps = proxyquire( "../../src/sequence-steps", {
	"./utils": utils
} );
const gitPushOriginMaster = sequenceSteps.gitPushOriginMaster;

test( "gitPushOriginMaster calls log.begin", t => {
	return gitPushOriginMaster( [ helpers.git, {} ], () => {
		t.ok( utils.log.begin.calledWith( "git push origin master" ) );
	} );
} );

test( "gitPushOriginMaster calls git.push", t => {
	return gitPushOriginMaster( [ helpers.git, {} ], () => {
		t.ok( helpers.git.push.calledWith( "origin", "master" ) );
	} );
} );

test( "gitPushOriginMaster calls log.end", t => {
	return gitPushOriginMaster( [ helpers.git, {} ], () => {
		t.ok( utils.log.end.called );
	} );
} );
