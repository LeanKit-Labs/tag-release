import test from "ava";
import utils from "../../src/utils";
import sinon from "sinon";
import { isPromise } from "../helpers/index.js";

const options = {};

test.beforeEach( t => {
	sinon.stub( utils, "getGitConfig" ).returns( Promise.resolve( "config" ) );
} );

test.afterEach( t => {
	utils.getGitConfig.restore();
} );

test.serial( "getGitConfigs returns a promise", t => {
	const promise = utils.getGitConfigs( options );
	t.truthy( isPromise( promise ) );
	return promise;
} );

test.serial( "getGitConfigs calls getGitConfig for username and token", t => {
	return utils.getGitConfigs( options ).then( () => {
		t.truthy( utils.getGitConfig.calledWithExactly( "tag-release.username" ) );
		t.truthy( utils.getGitConfig.calledWithExactly( "tag-release.token" ) );
	} );
} );
