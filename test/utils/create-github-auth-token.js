import test from "ava";
import sinon from "sinon";
import "sinon-as-promised";
import { isPromise } from "../helpers/index.js";
import utils from "../../src/utils.js";

const request = {
	post: sinon.spy( ( arg, callback ) => callback( null, [ {
		statusCode: 201,
		headers: {
			"x-github-otp": "required;"
		},
		body: { token: "1234567890" }
	} ] ) )
};
const logger = { log: sinon.stub() };

test.beforeEach( t => {
	sinon.stub( utils, "githubUnauthorized" ).returns( Promise.resolve() );
	utils.__Rewire__( "request", request );
	utils.__Rewire__( "logger", logger );
} );

test.afterEach( t => {
	utils.githubUnauthorized.restore();
	utils.__ResetDependency__( "request" );
	utils.__ResetDependency__( "logger" );
} );

test.serial( "createGitHubAuthToken returns a promise", t => {
	const promise = utils.createGitHubAuthToken( "username", "password" );
	t.truthy( isPromise( promise ) );
} );

test.serial( "createGitHubAuthToken executes a request.post command", t => {
	return utils.createGitHubAuthToken( "username", "password" ).then( () => {
		t.truthy( request.post.called );
	} );
} );

test.serial( "createGitHubAuthToken return token if stateCode 201", t => {
	return utils.createGitHubAuthToken( "username", "password" ).then( token => {
		t.is( token, "1234567890" );
	} );
} );

test.serial( "createGitHubAuthToken calls githubUnauthorized if stateCode 401", t => {
	const request401 = {
		post: sinon.spy( ( arg, callback ) => callback( null, [ {
			statusCode: 401
		} ] ) )
	};
	utils.__Rewire__( "request", request401 );
	return utils.createGitHubAuthToken( "username", "password" ).then( token => {
		t.truthy( utils.githubUnauthorized.called );
	} );
} );

test.serial( "createGitHubAuthToken logs message and erros on other statusCodes", t => {
	const request422 = {
		post: sinon.spy( ( arg, callback ) => callback( null, [ {
			statusCode: 422,
			body: { message: "error" },
			errors: [ { message: "something bad happened" } ]
		} ] ) )
	};
	utils.__Rewire__( "request", request422 );
	return utils.createGitHubAuthToken( "username", "password" ).catch( e => {
		t.is( logger.log.calledWith( "error" ) );
		t.is( logger.log.calledWith( "something bad happened" ) );
	} );
} );
