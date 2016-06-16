import test from "ava";
import sinon from "sinon";
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
	writeFile: sinon.spy()
};

import { gitLog, __RewireAPI__ as RewireAPI } from "../../src/sequence-steps";

test.beforeEach( t => {
	utils.exec.reset();
	RewireAPI.__Rewire__( "utils", utils );
} );

test.afterEach( t => {
	RewireAPI.__ResetDependency__( "utils" );
} );

test( "gitLog removes and formats a Next message", t => {
	const options = {};
	gitLog( [ git, options ] );
	t.ok( options.log, `* one
* two
* three` );
} );

test.cb( "gitLog calls log.begin when no Next", t => {
	utils.readFile = sinon.stub().returns( "" );
	gitLog( [ git, {} ] ).then( () => {
		t.ok( utils.log.begin.called );
		t.end();
	} );
} );

test.cb( "gitLog gets a list of tag versions when no Next", t => {
	utils.readFile = sinon.stub().returns( "" );
	gitLog( [ git, {} ] ).then( () => {
		t.ok( utils.exec.calledWith( "git tag --sort=v:refname" ) );
		t.end();
	} );
} );

test.cb( "gitLog gets a log with the latest release when no Next", t => {
	utils.readFile = sinon.stub().returns( "" );
	gitLog( [ git, {} ] ).then( () => {
		t.ok( utils.exec.calledWith( "git --no-pager log --no-merges --date-order --pretty=format:'%s' 1.1.." ) );
		t.end();
	} );
} );

test.cb( "gitLog gets all logs when there are no tags", t => {
	utils.readFile = sinon.stub().returns( "" );
	utils.exec = sinon.spy( command => new Promise( resolve => resolve( "" ) ) );
	gitLog( [ git, {} ] ).then( () => {
		t.ok( utils.exec.calledWith( "git --no-pager log --no-merges --date-order --pretty=format:'%s'" ) );
		t.end();
	} );
} );

test.cb( "gitLog calls log.end when no Next", t => {
	utils.readFile = sinon.stub().returns( "" );
	gitLog( [ git, {} ] ).then( () => {
		t.ok( utils.log.end.called );
		t.end();
	} );
} );

