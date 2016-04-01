import test from "ava";

let utils = {
	log: {
		begin: sinon.spy(),
		end: sinon.spy()
	},
	exec: sinon.spy( command => new Promise( resolve => resolve( "diff" ) ) ),
	prompt: sinon.spy( command => new Promise( resolve => resolve( { proceed: true } ) ) )
};
const sequenceSteps = proxyquire( "../../src/sequence-steps", {
	"./utils": utils
} );
const gitDiff = sequenceSteps.gitDiff;

test( "gitDiff calls log.begin", t => {
	return gitDiff( [ helpers.git, {} ], () => {
		t.ok( utils.log.begin.called );
	} );
} );

test( "gitDiff calls utils.exec with diff command", t => {
	const GIT_DIFF = "git diff --color CHANGELOG.md package.json";
	return gitDiff( [ helpers.git, {} ], () => {
		t.ok( utils.exec.calledWith( GIT_DIFF ) );
	} );
} );

test( "gitDiff prompts user if diff is acceptable", t => {
	return gitDiff( [ helpers.git, {} ], () => {
		t.ok( utils.prompt.called );
	} );
} );

test.skip( "gitDiff exit's program if user isn't okay with diff", t => {
	utils.prompt = sinon.spy( command => new Promise( resolve => resolve( { proceed: false } ) ) );

	sinon.stub( process, "exit" );
	return gitDiff( [ helpers.git, {} ], () => {
		t.ok( process.exit.calledWith( 0 ) );
		process.exit.restore();
	} );
} );

test( "gitDiff calls log.end", t => {
	return gitDiff( [ helpers.git, {} ], () => {
		t.ok( utils.log.end.called );
	} );
} );
