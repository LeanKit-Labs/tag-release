import test from "ava";
import sinon from "sinon";
import "sinon-as-promised";
import utils from "../../src/utils.js";

const logger = { log: sinon.stub() };

test.beforeEach( t => {
	sinon.stub( utils, "prompt" ).returns( Promise.resolve( { authCode: "1234567890" } ) );
	sinon.stub( utils, "createGitHubAuthToken" ).returns( Promise.resolve( "1234567890" ) );
	utils.__Rewire__( "logger", logger );
} );

test.afterEach( t => {
	utils.prompt.restore();
	utils.createGitHubAuthToken.restore();
	utils.__ResetDependency__( "logger" );
} );

test.serial( "githubUnauthorized executes prompt if twoFactorAuth", t => {
	const response = {
		statusCode: 201,
		headers: { "x-github-otp": "required;" }
	};
	return utils.githubUnauthorized( "username", "password", response ).then( () => {
		t.truthy( utils.prompt.called );
	} );
} );

test.serial( "githubUnauthorized executes createGitHubAuthToken if twoFactorAuth", t => {
	const response = {
		statusCode: 201,
		headers: { "x-github-otp": "required;" }
	};
	return utils.githubUnauthorized( "username", "password", response ).then( () => {
		t.truthy( utils.prompt.called );
	} );
} );

test.serial( "githubUnauthorized logs if not twoFactorAuth", t => {
	const response = {
		statusCode: 201,
		headers: {},
		body: { message: "error" }
	};
	utils.githubUnauthorized( "username", "password", response );
	t.truthy( logger.log.calledWith( "error" ) );
} );
