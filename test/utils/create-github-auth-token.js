import test from "ava";
import sinon from "sinon";
import { isPromise } from "../helpers/index.js";
import utils from "../../src/utils.js";

test.beforeEach( t => {
	sinon.stub( utils, "exec" ).returns( Promise.resolve( `{ "token": "1234567890" }` ) );
} );

test.afterEach( t => {
	utils.exec.restore();
} );

test.serial( "createGitHubAuthToken returns a promise", t => {
	const promise = utils.createGitHubAuthToken( "username", "password" );
	t.truthy( isPromise( promise ) );
} );

test.serial( "createGitHubAuthToken executes a curl command", t => {
	return utils.createGitHubAuthToken( "username", "password" ).then( () => {
		t.truthy( utils.exec.called );
	} );
} );

test.serial( "createGitHubAuthToken grabs the token from the curl response", t => {
	return utils.createGitHubAuthToken( "username", "password" ).then( token => {
		t.is( token, "1234567890" );
	} );
} );

test.serial( "createGitHubAuthToken returns an error on rejection", t => {
	utils.exec.restore();
	sinon.stub( utils, "exec" ).returns( Promise.reject( "error" ) );
	return utils.createGitHubAuthToken( "username", "password" ).catch( e => {
		t.is( e, "error" );
	} );
} );
