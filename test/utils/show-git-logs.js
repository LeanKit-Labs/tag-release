import test from "ava";
import utils from "../../src/utils";
import sinon from "sinon";
import "sinon-as-promised";

const options = {};
const logger = { log: sinon.spy() };

test.beforeEach( t => {
	utils.log = {
		begin: sinon.spy(),
		end: sinon.spy()
	};
	utils.exec = sinon.spy( command => new Promise( resolve => resolve( `1.0
1.1` ) ) );
	utils.readFile = sinon.stub().returns( `### Next

* one
* two
* three
` );
	utils.writeFile = sinon.spy();
	utils.advise = sinon.spy();
	utils.__Rewire__( "logger", logger );
} );

test.afterEach( t => {
	utils.__ResetDependency__( "logger" );
} );

test.serial( "utils.showGitLogs removes and formats a Next message", t => {
	utils.showGitLogs( options );
	t.truthy( options.log === `* one
* two
* three` );
} );

test.serial( "utils.showGitLogs calls log.begin when no Next", t => {
	utils.readFile = sinon.stub().returns( "" );
	return utils.showGitLogs( options ).then( () => {
		t.truthy( !utils.writeFile.called );
		t.truthy( utils.log.begin.called );
	} );
} );

test.serial( "utils.showGitLogs gets a list of tag versions when no Next", t => {
	utils.readFile = sinon.stub().returns( "" );
	return utils.showGitLogs( options ).then( () => {
		t.truthy( !utils.writeFile.called );
		t.truthy( utils.exec.calledWith( "git tag --sort=v:refname" ) );
	} );
} );

test.serial( "utils.showGitLogs gets a log with the latest release when no Next", t => {
	utils.readFile = sinon.stub().returns( "" );
	return utils.showGitLogs( options ).then( () => {
		t.truthy( !utils.writeFile.called );
		t.truthy( utils.exec.calledWith( "git --no-pager log --no-merges --date-order --pretty=format:'%s' 1.1.." ) );
	} );
} );

test.serial( "utils.showGitLogs gets all logs when there are no tags", t => {
	utils.readFile = sinon.stub().returns( "" );
	utils.exec = sinon.spy( command => new Promise( resolve => resolve( "" ) ) );
	return utils.showGitLogs( options ).then( () => {
		t.truthy( !utils.writeFile.called );
		t.truthy( utils.exec.calledWith( "git --no-pager log --no-merges --date-order --pretty=format:'%s'" ) );
	} );
} );

test.serial( "utils.showGitLogs calls log.end when no Next", t => {
	utils.readFile = sinon.stub().returns( "" );
	return utils.showGitLogs( options ).then( () => {
		t.truthy( !utils.writeFile.called );
		t.truthy( utils.log.end.called );
	} );
} );

test.serial( "utils.showGitLogs does not advise when there are logs", t => {
	utils.readFile = sinon.stub().returns( "" );
	utils.exec = sinon.stub();
	utils.exec.withArgs( "git tag --sort=v:refname" ).resolves( "1.0" );
	utils.exec.withArgs( "git --no-pager log --no-merges --date-order --pretty=format:'%s' 1.0.." ).resolves( `one
two
three` );

	return utils.showGitLogs( options ).then( () => {
		t.truthy( !utils.advise.called );
		t.truthy( logger.log.called );
	} );
} );

test.serial( "utils.showGitLogs gives advice when there are no logs", t => {
	utils.readFile = sinon.stub().returns( "" );
	utils.exec = sinon.stub();
	utils.exec.withArgs( "git tag --sort=v:refname" ).resolves( "1.0" );
	utils.exec.withArgs( "git --no-pager log --no-merges --date-order --pretty=format:'%s' 1.0.." ).resolves( `` );
	return utils.showGitLogs( options ).then( () => {
		t.truthy( utils.advise.called );
	} );
} );

test.serial( "utils.showGitLogs gives advice when using an old version of git", t => {
	utils.readFile = sinon.stub().returns( "" );
	utils.exec = sinon.stub().rejects();
	return utils.showGitLogs( options ).then( () => {
		t.truthy( utils.advise.calledWith( "gitLog.tag" ) );
	} );
} );
