import test from "ava";
import utils from "../../src/utils";
import sinon from "sinon";
import { isPromise } from "../helpers/index.js";

const USERNAME = "username";
const TOKEN = "token";
const chalk = { red: sinon.stub() };

test.beforeEach( t => {
	sinon.stub( utils, "setGitConfig" ).returns( Promise.resolve() );
	utils.__Rewire__( "chalk", chalk );
} );

test.afterEach( t => {
	utils.setGitConfig.restore();
	utils.__ResetDependency__( "chalk" );
} );

test.serial( "setGitConfigs returns a promise", t => {
	const promise = utils.setGitConfigs( USERNAME, TOKEN );
	t.truthy( isPromise( promise ) );
	return promise;
} );

test.serial( "setGitConfigs calls setGitConfig for username and token", t => {
	return utils.setGitConfigs( USERNAME, TOKEN ).then( () => {
		t.truthy( utils.setGitConfig.calledWithExactly( "tag-release.username", USERNAME ) );
		t.truthy( utils.setGitConfig.calledWithExactly( "tag-release.token", TOKEN ) );
	} );
} );

test.serial( "setGitConfigs should log an error if either setGitConfg failed", t => {
	utils.setGitConfig.restore();
	sinon.stub( utils, "setGitConfig" ).returns( Promise.reject( "error" ) );
	return utils.setGitConfigs( USERNAME, TOKEN ).then( e => {
		t.truthy( chalk.red.calledWithExactly( "error" ) );
	} );
} );
