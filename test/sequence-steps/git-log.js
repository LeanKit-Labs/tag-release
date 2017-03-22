import test from "ava";
import sinon from "sinon";
import "sinon-as-promised";
import { git } from "../helpers/index.js";

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
	writeFile: sinon.spy(),
	advise: sinon.spy()
};

import { gitLog, __RewireAPI__ as RewireAPI } from "../../src/sequence-steps";

test.beforeEach( t => {
	RewireAPI.__Rewire__( "utils", utils );
} );

test.afterEach( t => {
	RewireAPI.__ResetDependency__( "utils" );
	utils.advise.reset();
} );

test.serial( "gitLog removes and formats a Next message", t => {
	const options = {};
	gitLog( [ git, options ] );
	t.truthy( options.log, `* one
* two
* three` );
} );

test.serial( "gitLog calls log.begin when no Next", t => {
	utils.readFile = sinon.stub().returns( "" );
	return gitLog( [ git, {} ] ).then( () => {
		t.truthy( utils.log.begin.called );
	} );
} );

test.serial( "gitLog gets a list of tag versions when no Next", t => {
	utils.readFile = sinon.stub().returns( "" );
	return gitLog( [ git, {} ] ).then( () => {
		t.truthy( utils.exec.calledWith( "git tag --sort=v:refname" ) );
	} );
} );

test.serial( "gitLog gets a log with the latest release when no Next", t => {
	utils.readFile = sinon.stub().returns( "" );
	return gitLog( [ git, {} ] ).then( () => {
		t.truthy( utils.exec.calledWith( "git --no-pager log --no-merges --date-order --pretty=format:'%s' 1.1.." ) );
	} );
} );

test.serial( "gitLog gets all logs when there are no tags", t => {
	utils.readFile = sinon.stub().returns( "" );
	utils.exec = sinon.spy( command => new Promise( resolve => resolve( "" ) ) );
	return gitLog( [ git, {} ] ).then( () => {
		t.truthy( utils.exec.calledWith( "git --no-pager log --no-merges --date-order --pretty=format:'%s'" ) );
	} );
} );

test.serial( "gitLog calls log.end when no Next", t => {
	utils.readFile = sinon.stub().returns( "" );
	return gitLog( [ git, {} ] ).then( () => {
		t.truthy( utils.log.end.called );
	} );
} );

test.serial( "gitLog does not advise when there are logs", t => {
	utils.exec = sinon.stub();
	utils.exec.withArgs( "git tag --sort=v:refname" ).resolves( "1.0" );
	utils.exec.withArgs( "git --no-pager log --no-merges --date-order --pretty=format:'%s' 1.0.." ).resolves( `one
two
three` );
	return gitLog( [ git, {} ] ).then( () => {
		t.truthy( !utils.advise.called );
	} );
} );

test.serial( "gitLog gives advise when there are no logs", t => {
	utils.exec = sinon.stub();
	utils.exec.withArgs( "git tag --sort=v:refname" ).resolves( "1.0" );
	utils.exec.withArgs( "git --no-pager log --no-merges --date-order --pretty=format:'%s' 1.0.." ).resolves( `` );
	return gitLog( [ git, {} ] ).then( () => {
		t.truthy( utils.advise.called );
	} );
} );

test.serial( "gitLog gives advise when using an old version of git", t => {
	utils.readFile = sinon.stub().returns( "" );
	utils.exec = sinon.stub().rejects();
	return gitLog( [ git, {} ] ).catch( () => {
		t.truthy( utils.advise.called );
	} );
} );

test.serial( "gitLog should filter pre-release versions out for release", t => {
	utils.readFile = sinon.stub().returns( "" );
	utils.exec = sinon.spy( command => new Promise( resolve => resolve( `v1.0.0
v2.0.0
v2.1.0-blah.0` ) ) );
	return gitLog( [ git, {} ] ).then( () => {
		t.truthy( utils.exec.calledWith( "git --no-pager log --no-merges --date-order --pretty=format:'%s' v2.0.0.." ) );
	} );
} );

test.serial( "gitLog should use currentVersion when in pre-release mode", t => {
	utils.readFile = sinon.stub().returns( "" );
	utils.exec = sinon.spy( command => new Promise( resolve => resolve( `v1.0.0
v2.0.0
v2.1.0-blah.0` ) ) );
	return gitLog( [ git, { prerelease: true, currentVersion: "2.1.0-blah.0" } ] ).then( () => {
		t.truthy( utils.exec.calledWith( "git --no-pager log --no-merges --date-order --pretty=format:'%s' v2.1.0-blah.0.." ) );
	} );
} );
