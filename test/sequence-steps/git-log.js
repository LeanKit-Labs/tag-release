import test from "ava";

const utils = {
	log: {
		begin: sinon.spy(),
		end: sinon.spy()
	},
	exec: sinon.spy( command => new Promise( resolve => resolve( `1.0
1.1` ) ) ),
	readFile: sinon.stub().returns( `### Next

* one
* two
* three
` ),
	writeFile: sinon.spy()
};
const sequenceSteps = proxyquire( "../../src/sequence-steps", {
	"./utils": utils
} );
const gitLog = sequenceSteps.gitLog;

test( "gitLog removes and formats a Next message", t => {
	const options = {};
	gitLog( [ helpers.git, options ] );
	t.ok( options.log, `* one
* two
* three` );
} );

test.cb( "gitLog calls log.begin when no Next", t => {
	utils.readFile = sinon.stub().returns( "" );
	gitLog( [ helpers.git, {} ] ).then( () => {
		t.ok( utils.log.begin.called );
		t.end();
	} );
} );

test.cb( "gitLog gets a list of tag versions when no Next", t => {
	utils.readFile = sinon.stub().returns( "" );
	gitLog( [ helpers.git, {} ] ).then( () => {
		t.ok( utils.exec.calledWith( "git tag --sort=v:refname" ) );
		t.end();
	} );
} );

test.cb( "gitLog gets a log with the latest release when no Next", t => {
	utils.readFile = sinon.stub().returns( "" );
	gitLog( [ helpers.git, {} ] ).then( () => {
		t.ok( utils.exec.calledWith( "git --no-pager log --no-merges --date-order --pretty=format:'%s' 1.1.." ) );
		t.end();
	} );
} );

test.cb( "gitLog calls log.end when no Next", t => {
	utils.readFile = sinon.stub().returns( "" );
	gitLog( [ helpers.git, {} ] ).then( () => {
		t.ok( utils.log.end.called );
		t.end();
	} );
} );
