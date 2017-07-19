jest.mock( "child_process", () => ( {
	exec: jest.fn( ( command, cb ) => {
		cb( null, "success" );
	} )
} ) );

jest.mock( "fs", () => ( {
	readFileSync: jest.fn( args => {
		// `npm.js` is calling this function to load it's own `package.json` file
		// and calling `JSON.parse` on it...so to satisfy it, we need to return
		// a valid JSON string so it doesn't barf
		if ( args.includes( "npm/package.json" ) ) {
			return JSON.stringify( {} );
		}

		return args;
	} ),
	writeFileSync: jest.fn(),
	unlinkSync: jest.fn(),
	ReadStream: jest.fn(),
	WriteStream: jest.fn(),
	existsSync: jest.fn().mockReturnValue( true ),
	unlink: jest.fn()
} ) );

jest.mock( "inquirer", () => ( {
	prompt: jest.fn( ( arg, cb ) => {
		cb( "answers" );
	} )
} ) );

jest.mock( "detect-indent", () => {
	return jest.fn( () => ( {
		indent: "    "
	} ) );
} );

jest.mock( "request", () => ( {
	post: jest.fn( ( arg, cb ) => {
		cb( null, [ {
			statusCode: 201,
			headers: {
				"x-github-otp": "required;"
			},
			body: {
				token: "1234567890",
				message: "it worked"
			}
		} ], {
			token: "1234567890",
			message: "it worked"
		} );
	} )
} ) );

jest.mock( "editor", () => {
	return jest.fn( ( arg, cb ) => cb( 0 ) );
} );

jest.mock( "lodash", () => {
	const _ = require.requireActual( "lodash" );
	return {
		identity: _.identity,
		isObject: _.isObject,
		get: jest.fn()
	};
} );

jest.mock( "log-update", () => {
	const mockLogUpdate = jest.fn();
	mockLogUpdate.done = jest.fn();
	return mockLogUpdate;
} );

jest.mock( "chalk", () => ( {
	red: jest.fn( arg => arg ),
	green: jest.fn( arg => arg ),
	yellow: jest.fn( arg => arg )
} ) );

jest.mock( "better-console", () => ( {
	log: jest.fn()
} ) );

jest.mock( "npm", () => ( {
	load: jest.fn( ( arg, cb ) => {
		cb( null, { name: "tag-release", version: "1.2.3" } );
	} ),
	commands: {
		show: jest.fn( ( arg1, arg2, cb ) => {
			cb( null, {
				"1.2.3": {
					versions: []
				}
			} );
		} )
	}
} ) );

jest.mock( "cowsay", () => ( {
	say: jest.fn( arg => arg )
} ) );

jest.mock( "../src/advise.js", () => {
	return jest.fn( arg => arg );
} );

jest.mock( "../package.json", () => ( {
	version: "1.1.1"
} ) );

import cp from "child_process";
import fs from "fs";
import { get } from "lodash";
import detectIndent from "detect-indent";
import inquirer from "inquirer";
import editor from "editor";
import logUpdate from "log-update";
import logger from "better-console";
import chalk from "chalk";
import request from "request";
import npm from "npm";
import cowsay from "cowsay";
import advise from "../src/advise.js"; // eslint-disable-line no-unused-vars
import currentPackage from "../package.json";
import util from "../src/utils";
import { isPromise } from "./helpers";

const originalGithubUnauthorizedFunction = util.githubUnauthorized;

describe( "utils", () => {
	describe( "readFile", () => {
		it( "should read the file contents", () => {
			util.readFile( "./data/read-test.md" );
			expect( fs.readFileSync ).toHaveBeenCalledTimes( 1 );
			expect( fs.readFileSync ).toHaveBeenCalledWith( "./data/read-test.md", "utf-8" );
		} );

		it( "should return null if the file doesn't exist", () => {
			fs.readFileSync = jest.fn( () => {
				throw new Error( "nope" );
			} );

			const result = util.readFile( "nope.md" );
			expect( fs.readFileSync ).toHaveBeenCalledTimes( 1 );
			expect( result ).toEqual( null );
		} );

		it( "should return null when given an empty path", () => {
			const result = util.readFile( null );
			expect( result ).toBeNull();
		} );
	} );

	describe( "readJSONFile", () => {
		beforeEach( () => {
			util.readFile = jest.fn( () => JSON.stringify( { x: 7, y: 8, z: 9 } ) );
		} );

		it( "should read a file", () => {
			util.readJSONFile( "./data/read-json-file.json" );
			expect( util.readFile ).toHaveBeenCalledTimes( 1 );
			expect( util.readFile ).toHaveBeenCalledWith( "./data/read-json-file.json" );
		} );

		it( "should parse the returned content", () => {
			const contents = util.readJSONFile( "./data/read-json-file.json" );
			expect( contents ).toEqual( { x: 7, y: 8, z: 9 } );
		} );

		it( "should return an empty object when `util.readFile` returns null", () => {
			util.readFile = jest.fn( () => ( null ) );
			const contents = util.readJSONFile( null );
			expect( contents ).toEqual( {} );
		} );
	} );

	describe( "writeFile", () => {
		it( "should write the given content to the given file", () => {
			const content = "this is some content for the file";
			util.writeFile( "./data/write-file-test.md", content );
			expect( fs.writeFileSync ).toHaveBeenCalledTimes( 1 );
			expect( fs.writeFileSync ).toHaveBeenCalledWith( "./data/write-file-test.md", "this is some content for the file", "utf-8" );
		} );
	} );

	describe( "writeJSONFile", () => {
		const file = "./manifest.json";
		const contents = { one: "1", two: "2", three: "3" };

		beforeEach( () => {
			fs.readFileSync = jest.fn( () => ( contents ) );
			util.writeFile = jest.fn();
		} );

		afterEach( () => {
			fs.existsSync = jest.fn().mockReturnValue( true );
		} );

		it( "should read from the given file", () => {
			util.writeJSONFile( file, contents );
			expect( fs.readFileSync ).toHaveBeenCalledTimes( 1 );
			expect( fs.readFileSync ).toHaveBeenCalledWith( "./manifest.json", "utf-8" );
		} );

		it( "should detect the indent of the given file", () => {
			util.writeJSONFile( file, contents );
			expect( detectIndent ).toHaveBeenCalledTimes( 1 );
			expect( detectIndent ).toHaveBeenCalledWith( { one: "1", two: "2", three: "3" } );
		} );

		it( "should write the formatted contents to the given file", () => {
			util.writeJSONFile( file, contents );
			expect( util.writeFile ).toHaveBeenCalledTimes( 1 );
			expect( util.writeFile ).toHaveBeenCalledWith( "./manifest.json", `{\n    "one": "1",\n    "two": "2",\n    "three": "3"\n}\n` );
		} );

		it( "should return a default indent of 2 spaces when `detectIndent` fails to return an indent value", () => {
			JSON.stringify = jest.fn();
			detectIndent.mockImplementation( () => {
				return jest.fn( () => ( {
					indent: null
				} ) );
			} );

			util.writeJSONFile( file, contents );
			expect( JSON.stringify ).toHaveBeenCalledTimes( 1 );
			expect( JSON.stringify ).toHaveBeenCalledWith( { one: "1", two: "2", three: "3" }, null, "  " );
		} );

		it( "should use default indent of 2 spaces when JSON files doesn't exist to read from", () => {
			JSON.stringify = jest.fn();
			fs.existsSync = jest.fn().mockReturnValue( false );

			util.writeJSONFile( file, contents );
			expect( JSON.stringify ).toHaveBeenCalledTimes( 1 );
			expect( JSON.stringify ).toHaveBeenCalledWith( { one: "1", two: "2", three: "3" }, null, "  " );
		} );
	} );

	describe( "deleteFile", () => {
		const path = "./some_unknown_path/.test.txt";
		it( "should delete given file", () => {
			util.deleteFile( path );
			expect( fs.unlink ).toHaveBeenCalledTimes( 1 );
			expect( fs.unlink ).toHaveBeenCalledWith( path );
		} );

		it( "should return if given file doesn't exist", () => {
			fs.existsSync = jest.fn().mockReturnValue( false );
			util.deleteFile( path );
			expect( fs.unlink ).toHaveBeenCalledTimes( 0 );
		} );
	} );

	describe( "exec", () => {
		it( "should return a promise", () => {
			const result = util.exec( `say "test"` );
			expect( isPromise( result ) ).toBeTruthy();
		} );

		it( "should execute the given command with child_process.exec", () => {
			return util.exec( `say "test"` ).then( () => {
				expect( cp.exec ).toHaveBeenCalledTimes( 1 );
				expect( cp.exec ).toHaveBeenCalledWith( `say "test"`, expect.any( Function ) );
			} );
		} );

		it( "should resolve if the call to child_process.exec succeeds", () => {
			return util.exec( `say "test"` ).then( result => {
				expect( result ).toEqual( "success" );
			} );
		} );

		it( "should reject if the call to child_process.exec fails", () => {
			cp.exec = jest.fn( ( command, cb ) => {
				cb( "nope", null );
			} );

			return util.exec( `say "test"` ).catch( err => {
				expect( cp.exec ).toHaveBeenCalledTimes( 1 );
				expect( err ).toEqual( "nope" );
			} );
		} );
	} );

	describe( "prompt", () => {
		const questions = [ { type: "confirm", message: "proceed", name: "proceed" } ];

		it( "should return a promise", () => {
			const result = util.prompt( questions );
			expect( isPromise( result ) ).toBeTruthy();
		} );

		it( "should run inquirer.prompt", () => {
			return util.prompt( questions ).then( () => {
				expect( inquirer.prompt ).toHaveBeenCalledTimes( 1 );
				expect( inquirer.prompt ).toHaveBeenCalledWith( [ { type: "confirm", message: "proceed", name: "proceed" } ], expect.any( Function ) );
			} );
		} );

		it( "should resolve if inquirer.prompt succeeds", () => {
			return util.prompt( questions ).then( results => {
				expect( results ).toEqual( "answers" );
			} );
		} );
	} );

	describe( "editLog", () => {
		beforeEach( () => {
			util.readFile = jest.fn( () => "monkeys" );
			util.writeFile = jest.fn();
		} );

		it( "should return a promise", () => {
			const result = util.editLog( "monkey" );
			expect( isPromise( result ) ).toBeTruthy();
		} );

		it( "should write to a file at tempFilePath", () => {
			return util.editLog( "monkey" ).then( () => {
				expect( editor ).toHaveBeenCalledTimes( 1 );
				expect( util.writeFile ).toHaveBeenCalledTimes( 1 );
				expect( util.writeFile ).toHaveBeenCalledWith( "./.shortlog", "monkey" );
			} );
		} );

		it( "should read tempFilePath after success", () => {
			return util.editLog( "monkey" ).then( () => {
				expect( editor ).toHaveBeenCalledTimes( 1 );
				expect( util.readFile ).toHaveBeenCalledTimes( 1 );
				expect( util.readFile ).toHaveBeenCalledWith( "./.shortlog" );
			} );
		} );

		it( "should remove tempFilePath after success", () => {
			return util.editLog( "monkey" ).then( () => {
				expect( editor ).toHaveBeenCalledTimes( 1 );
				expect( fs.unlinkSync ).toHaveBeenCalledTimes( 1 );
				expect( fs.unlinkSync ).toHaveBeenCalledWith( "./.shortlog" );
			} );
		} );

		it( "should resolve after success", () => {
			return util.editLog( "monkey" ).then( data => {
				expect( editor ).toHaveBeenCalledTimes( 1 );
				expect( data ).toEqual( "monkeys" );
			} );
		} );

		it( "should reject after failure", () => {
			editor.mockImplementation( ( arg, cb ) => cb( "nope" ) );

			return util.editLog( "monkey" ).catch( err => {
				expect( editor ).toHaveBeenCalledTimes( 1 );
				expect( err ).toEqual( "Unable to edit ./.shortlog" );
			} );
		} );
	} );

	describe( "isPackagePrivate", () => {
		it( "should return true when `private` is true in the config file", () => {
			util.readJSONFile = jest.fn( () => {
				return { private: true };
			} );

			const isPrivate = util.isPackagePrivate( "test-package.json" );
			expect( isPrivate ).toBeTruthy();
		} );

		it( "should return false when `private` is false in the config file", () => {
			util.readJSONFile = jest.fn( () => {
				return { private: false };
			} );

			const isPrivate = util.isPackagePrivate( "test-package.json" );
			expect( isPrivate ).toBeFalsy();
		} );

		it( "should return false when `private` is not defined in the config file", () => {
			util.readJSONFile = jest.fn( () => {
				return { not: "defined" };
			} );

			const isPrivate = util.isPackagePrivate( "test-package.json" );
			expect( isPrivate ).toBeFalsy();
		} );
	} );

	describe( "getPackageRegistry", () => {
		beforeEach( () => {
			util.exec = jest.fn( () => Promise.resolve() );
			get.mockReturnValue( () => "http://example.com/take-on-me" );
			util.readJSONFile = jest.fn( () => ( {
				name: "@aha/take-on-me"
			} ) );
		} );

		it( "should read registry from package.json", () => {
			return util.getPackageRegistry().then( () => {
				expect( get ).toHaveBeenCalledTimes( 1 );
				expect( get ).toHaveBeenCalledWith( { name: "@aha/take-on-me" }, "publishConfig.registry" );
			} );
		} );

		it( "should read registry from npm config when not supplied in package.json", () => {
			get.mockReturnValue( null );
			return util.getPackageRegistry().then( () => {
				expect( util.exec ).toHaveBeenCalledTimes( 1 );
				expect( util.exec ).toHaveBeenCalledWith( "npm get @aha:registry" );
			} );
		} );

		it( "should read registry from npm config without scope when not supplied in package.json", () => {
			get.mockReturnValue( null );
			util.readJSONFile = jest.fn( () => ( {
				name: "take-on-me"
			} ) );

			return util.getPackageRegistry().then( () => {
				expect( util.exec ).toHaveBeenCalledTimes( 1 );
				expect( util.exec ).toHaveBeenCalledWith( "npm get registry" );
			} );
		} );
	} );

	describe( "log", () => {
		beforeEach( () => {
			util.log.begin( "monkey" );
		} );

		it( "log begin writes to logUpdate", () => {
			expect( logUpdate ).toHaveBeenCalledTimes( 1 );
			expect( logUpdate ).toHaveBeenCalledWith( "monkey ☐" );
		} );

		it( "log end updates logUpdate", () => {
			util.log.end();
			expect( logUpdate ).toHaveBeenCalledTimes( 2 );
			expect( logUpdate ).toHaveBeenCalledWith( "monkey ☑" );
		} );

		it( "log end completes logUpdate", () => {
			util.log.end();
			expect( logUpdate.done ).toHaveBeenCalledTimes( 1 );
		} );
	} );

	describe( "getGitConfig", () => {
		beforeEach( () => {
			util.exec = jest.fn( () => Promise.resolve( "some result" ) );
		} );

		it( "should returna a promise", () => {
			const result = util.getGitConfig( "foo" );
			expect( isPromise( result ) ).toBeTruthy();
		} );

		it( "should call `exec` with the appropriate arguments", () => {
			return util.getGitConfig( "tag-release.username" ).then( () => {
				expect( util.exec ).toHaveBeenCalledTimes( 1 );
				expect( util.exec ).toHaveBeenCalledWith( "git config --global tag-release.username" );
			} );
		} );
	} );

	describe( "setGitConfig", () => {
		beforeEach( () => {
			util.exec = jest.fn( () => Promise.resolve( "some value" ) );
		} );

		it( "should return a promise", () => {
			const result = util.setGitConfig( "tag-release.username", "monkey" );
			expect( isPromise( result ) ).toBeTruthy();
		} );

		it( "should call `exec` with the appropriate arguments", () => {
			return util.setGitConfig( "tag-release.username", "monkey" ).then( () => {
				expect( util.exec ).toHaveBeenCalledTimes( 1 );
				expect( util.exec ).toHaveBeenCalledWith( "git config --global tag-release.username monkey" );
			} );
		} );
	} );

	describe( "getGitConfigs", () => {
		beforeEach( () => {
			util.getGitConfig = jest.fn( () => Promise.resolve() );
		} );

		it( "should return a promise", () => {
			const result = util.getGitConfigs();
			expect( isPromise( result ) ).toBeTruthy();
		} );

		it( "calls getGitConfig for username and token", () => {
			return util.getGitConfigs().then( () => {
				expect( util.getGitConfig ).toHaveBeenCalledTimes( 2 );
				expect( util.getGitConfig ).toHaveBeenCalledWith( "tag-release.username" );
				expect( util.getGitConfig ).toHaveBeenCalledWith( "tag-release.token" );
			} );
		} );
	} );

	describe( "setGitConfigs", () => {
		const USERNAME = "username";
		const TOKEN = "token";

		beforeEach( () => {
			util.setGitConfig = jest.fn( () => Promise.resolve() );
		} );

		it( "should return a promise", () => {
			const result = util.setGitConfigs( USERNAME, TOKEN );
			expect( isPromise( result ) ).toBeTruthy();
		} );

		it( "should call `setGitConfig` for username and token", () => {
			return util.setGitConfigs( USERNAME, TOKEN ).then( () => {
				expect( util.setGitConfig ).toHaveBeenCalledTimes( 2 );
				expect( util.setGitConfig ).toHaveBeenCalledWith( "tag-release.username", "username" );
				expect( util.setGitConfig ).toHaveBeenCalledWith( "tag-release.token", "token" );
			} );
		} );

		it( "should log an error if either call to `setGitConfig` fails", () => {
			util.setGitConfig = jest.fn( () => Promise.reject( "nope" ) );
			return util.setGitConfigs( USERNAME, TOKEN ).catch( err => {
				expect( chalk.red ).toHaveBeenCalledTimes( 1 );
				expect( chalk.red ).toHaveBeenCalledWith( "nope" );

				expect( logger.log ).toHaveBeenCalledTimes( 1 );
			} );
		} );
	} );

	describe( "escapeCurlPassword", () => {
		it( "should not change a password without characters that need escaped", () => {
			expect( util.escapeCurlPassword( "normal" ) ).toEqual( "normal" );
		} );

		it( "should escape passwords that contain characters that need to be escaped", () => {
			expect( util.escapeCurlPassword( "we$rd" ) ).toEqual( "we\\$rd" );
		} );
	} );

	describe( "createGitHubAuthToken", () => {
		beforeEach( () => {
			util.githubUnauthorized = jest.fn( () => Promise.resolve() );
		} );

		afterAll( () => {
			util.githubUnauthorized = originalGithubUnauthorizedFunction;
		} );

		it( "should return a promise", () => {
			const result = util.createGitHubAuthToken( "username", "password" );
			expect( isPromise( result ) ).toBeTruthy();
		} );

		it( "should execute an http POST request to GitHub", () => {
			return util.createGitHubAuthToken( "username", "password" ).then( () => {
				expect( request.post ).toHaveBeenCalledTimes( 1 );
				const requestArgs = request.post.mock.calls[ 0 ][ 0 ];
				expect( requestArgs.url ).toEqual( "https://api.github.com/authorizations" );
				expect( requestArgs.headers ).toEqual( {
					"User-Agent": "request"
				} );
				expect( requestArgs.auth ).toEqual( {
					user: "username",
					pass: "password"
				} );
				expect( requestArgs.json.scopes ).toEqual( [ "repo" ] );
				expect( requestArgs.json.note ).toContain( "tag-release-" );
			} );
		} );

		it( "should return a token if the response statusCode is 201", () => {
			return util.createGitHubAuthToken( "username", "password" ).then( token => {
				expect( token ).toEqual( "1234567890" );
			} );
		} );

		it( "should call `githubUnauthorized` if the response statusCode is 401", () => {
			request.post = jest.fn( ( arg, cb ) => {
				cb( null, [ {
					statusCode: 401
				} ] );
			} );

			return util.createGitHubAuthToken( "username", "password" ).then( () => {
				expect( util.githubUnauthorized ).toHaveBeenCalledTimes( 1 );
			} );
		} );

		it( "should log a message and errors for any other response statusCode", () => {
			request.post = jest.fn( ( arg, cb ) => {
				cb( null, [ {
					statusCode: 422,
					body: { message: "nope" },
					errors: [ { message: "something bad happened" } ]
				} ], {
					message: "nope"
				} );
			} );

			return util.createGitHubAuthToken( "username", "password" ).then( () => {
				expect( logger.log ).toHaveBeenCalledTimes( 2 );
				expect( logger.log ).toHaveBeenCalledWith( "nope" );
				expect( logger.log ).toHaveBeenCalledWith( "something bad happened" );
			} );
		} );

		it( "should log a message when the request throws an error", () => {
			request.post = jest.fn( ( arg, cb ) => {
				cb( "nope", null );
			} );

			return util.createGitHubAuthToken( "username", "password" ).catch( err => {
				expect( err ).toEqual( "nope" );
				expect( logger.log ).toHaveBeenCalledTimes( 1 );
				expect( logger.log ).toHaveBeenCalledWith( "error", "nope" );
			} );
		} );
	} );

	describe( "githubUnauthorized", () => {
		beforeEach( () => {
			util.prompt = jest.fn( () => Promise.resolve( { authCode: "1234567890" } ) );
			util.createGitHubAuthToken = jest.fn( () => Promise.resolve( "1234567890" ) );
		} );

		it( "should prompt if two-factor auth is enabled for the user", () => {
			const response = {
				statusCode: 201,
				headers: { "x-github-otp": "required;" }
			};

			return util.githubUnauthorized( "username", "password", response ).then( () => {
				expect( util.prompt ).toHaveBeenCalledTimes( 1 );
				expect( util.prompt ).toHaveBeenCalledWith( [ {
					type: "input",
					name: "authCode",
					message: "What is the GitHub authentication code on your device"
				} ] );
			} );
		} );

		it( "should run `createGitHubAuthToken` if two-factor auth is enabled for the user", () => {
			const response = {
				statusCode: 201,
				headers: { "x-github-otp": "required;" }
			};

			return util.githubUnauthorized( "username", "password", response ).then( () => {
				expect( util.createGitHubAuthToken ).toHaveBeenCalledTimes( 1 );
				expect( util.createGitHubAuthToken ).toHaveBeenCalledWith( "username", "password", {
					"X-GitHub-OTP": "1234567890"
				} );
			} );
		} );

		it( "should log if two-factor auth is not enabled for the user", () => {
			const response = {
				statusCode: 201,
				headers: {},
				body: { message: "nope" }
			};

			util.githubUnauthorized( "username", "password", response );
			expect( logger.log ).toHaveBeenCalledTimes( 1 );
			expect( logger.log ).toHaveBeenCalledWith( "nope" );
		} );
	} );

	describe( "getCurrentVersion", () => {
		it( "should return the package.json `version`", () => {
			expect( util.getCurrentVersion() ).toEqual( "1.1.1" );
		} );
	} );

	describe( "getAvailableVersionInfo", () => {
		beforeEach( () => {
			npm.commands.show = jest.fn( ( arg1, arg2, cb ) => {
				cb( null, {
					"4.5.0": {
						versions: [
							"0.0.1",
							"0.0.2",
							"1.0.0",
							"2.0.0",
							"3.0.0",
							"3.0.1",
							"3.1.0",
							"3.2.0",
							"3.3.0",
							"3.4.0-trying-something.0",
							"3.3.1",
							"4.0.0",
							"4.0.1",
							"4.1.0",
							"4.2.0",
							"4.2.1",
							"4.3.0",
							"4.4.0",
							"4.3.1",
							"4.5.0",
							"5.0.0-refactor-and-jest.0",
							"5.2.0-another-prerelease.1",
							"5.2.0-another-prerelease.0"
						]
					}
				} );
			} );
		} );

		it( "should load npm package info for tag-release", () => {
			return util.getAvailableVersionInfo().then( () => {
				expect( npm.load ).toHaveBeenCalledTimes( 1 );
				expect( npm.load ).toHaveBeenCalledWith( { name: "tag-release", loglevel: "silent" }, expect.any( Function ) );
			} );
		} );

		it( "should fetch available npm versions for tag-release", () => {
			return util.getAvailableVersionInfo().then( () => {
				expect( npm.commands.show ).toHaveBeenCalledTimes( 1 );
				expect( npm.commands.show ).toHaveBeenCalledWith( [ "tag-release", "versions" ], true, expect.any( Function ) );
			} );
		} );

		it( "should reject when `npm.load` throws an error", () => {
			npm.load = jest.fn( ( arg, cb ) => {
				cb( "nope", null );
			} );

			return util.getAvailableVersionInfo().catch( err => {
				expect( err ).toEqual( "nope" );
			} );
		} );

		it( "should reject when `npm.commands.show` throws an error", () => {
			npm.commands.show = jest.fn( ( arg1, arg2, cb ) => {
				cb( "nope", null );
			} );

			return util.getAvailableVersionInfo().catch( err => {
				expect( err ).toEqual( "nope" );
			} );
		} );
	} );

	describe( "detectVersion", () => {
		describe( "when using a non-prerelease version", () => {
			beforeEach( () => {
				currentPackage.version = "4.5.0";
				util.getAvailableVersionInfo = jest.fn( () => ( Promise.resolve( {
					latestFullVersion: "4.5.0",
					latestPrereleaseVersion: "5.0.0-refactor-and-jest.0"
				} ) ) );
			} );

			describe( "and using the latest version", () => {
				it( "should log the appropriate message", () => {
					return util.detectVersion().then( () => {
						expect( chalk.green ).toHaveBeenCalledTimes( 1 );
						expect( chalk.green ).toHaveBeenCalledWith( "You're running the latest version (4.5.0) of tag-release." );
					} );
				} );
			} );

			describe( "and there is a newer version available", () => {
				beforeEach( () => {
					currentPackage.version = "4.4.0";
				} );

				it( "should log the appropriate message", () => {
					return util.detectVersion().then( () => {
						expect( chalk.red ).toHaveBeenCalledTimes( 2 );
						expect( chalk.red.mock.calls[ 0 ] ).toEqual( [ "There is an updated version (4.5.0) of tag-release available." ] );
						expect( chalk.red.mock.calls[ 1 ] ).toEqual( [ "To upgrade, run 'npm install -g tag-release'" ] );
						expect( chalk.yellow ).toHaveBeenCalledTimes( 2 );
						expect( chalk.yellow.mock.calls[ 0 ] ).toEqual( [ "4.5.0" ] );
						expect( chalk.yellow.mock.calls[ 1 ] ).toEqual( [ "'npm install -g tag-release'" ] );
					} );
				} );
			} );
		} );

		describe( "when using a prerelease version", () => {
			beforeEach( () => {
				util.getAvailableVersionInfo = jest.fn( () => ( Promise.resolve( {
					latestFullVersion: "7.6.0",
					latestPrereleaseVersion: "7.7.7-pre.0"
				} ) ) );
			} );

			describe( "and it is the latest available prerelease version", () => {
				beforeEach( () => {
					currentPackage.version = "7.7.7-pre.0";
				} );

				it( "should log the appropriate message", () => {
					return util.detectVersion().then( () => {
						expect( chalk.green ).toHaveBeenCalledTimes( 1 );
						expect( chalk.green ).toHaveBeenCalledWith( "You're running the latest pre-release version (7.7.7-pre.0) of tag-release." );
					} );
				} );
			} );

			describe( "and there is a newer prerelease version available", () => {
				beforeEach( () => {
					currentPackage.version = "7.7.1-pre.0";
				} );

				it( "should log the appropriate message", () => {
					return util.detectVersion().then( () => {
						expect( chalk.red ).toHaveBeenCalledTimes( 2 );
						expect( chalk.red.mock.calls[ 0 ] ).toEqual( [ "There is an updated pre-release version (7.7.7-pre.0) of tag-release available." ] );
						expect( chalk.red.mock.calls[ 1 ] ).toEqual( [ "To upgrade, run 'npm install -g tag-release@7.7.7-pre.0'" ] );
						expect( chalk.yellow ).toHaveBeenCalledTimes( 2 );
						expect( chalk.yellow.mock.calls[ 0 ] ).toEqual( [ "7.7.7-pre.0" ] );
						expect( chalk.yellow.mock.calls[ 1 ] ).toEqual( [ "'npm install -g tag-release@7.7.7-pre.0'" ] );
					} );
				} );

				describe( "with a different prerelease tag", () => {
					beforeEach( () => {
						currentPackage.version = "7.7.1-pre.0";
						util.getAvailableVersionInfo = jest.fn( () => ( Promise.resolve( {
							latestFullVersion: "7.6.0",
							latestPrereleaseVersion: "7.8.0-some-other-pre.0"
						} ) ) );
					} );

					it( "should log the appropriate message", () => {
						return util.detectVersion().then( () => {
							expect( chalk.red ).toHaveBeenCalledTimes( 2 );
							expect( chalk.red.mock.calls[ 0 ] ).toEqual( [ "There is an updated pre-release version (7.8.0-some-other-pre.0) of tag-release available." ] );
							expect( chalk.red.mock.calls[ 1 ] ).toEqual( [ "To upgrade, run 'npm install -g tag-release@7.8.0-some-other-pre.0'" ] );
							expect( chalk.yellow ).toHaveBeenCalledTimes( 2 );
							expect( chalk.yellow.mock.calls[ 0 ] ).toEqual( [ "7.8.0-some-other-pre.0" ] );
							expect( chalk.yellow.mock.calls[ 1 ] ).toEqual( [ "'npm install -g tag-release@7.8.0-some-other-pre.0'" ] );
						} );
					} );
				} );
			} );

			describe( "and there is a newer non-prerelease version available", () => {
				beforeEach( () => {
					currentPackage.version = "7.7.7-pre.0";
					util.getAvailableVersionInfo = jest.fn( () => ( Promise.resolve( {
						latestFullVersion: "7.8.0",
						latestPrereleaseVersion: "7.7.7-pre.0"
					} ) ) );
				} );

				it( "should log the appropriate message", () => {
					return util.detectVersion().then( () => {
						expect( chalk.red ).toHaveBeenCalledTimes( 2 );
						expect( chalk.red.mock.calls[ 0 ] ).toEqual( [ "There is an updated full version (7.8.0) of tag-release available." ] );
						expect( chalk.red.mock.calls[ 1 ] ).toEqual( [ "To upgrade, run 'npm install -g tag-release'" ] );
						expect( chalk.yellow ).toHaveBeenCalledTimes( 2 );
						expect( chalk.yellow.mock.calls[ 0 ] ).toEqual( [ "7.8.0" ] );
						expect( chalk.yellow.mock.calls[ 1 ] ).toEqual( [ "'npm install -g tag-release'" ] );
					} );
				} );
			} );
		} );
	} );

	describe( "advise", () => {
		beforeEach( () => {
			process.exit = jest.fn();
		} );

		it( "should call `cowsay.say`", () => {
			util.advise( "hello world", { exit: false } );
			expect( cowsay.say ).toHaveBeenCalledTimes( 1 );
			expect( cowsay.say ).toHaveBeenCalledWith( expect.objectContaining( {
				text: "hello world"
			} ) );
		} );

		it( "should call `logger.log`", () => {
			util.advise( "hello world", { exist: false } );
			expect( logger.log ).toHaveBeenCalledTimes( 1 );
		} );

		it( "should call `process.exit` when the the `exit` flag is passed", () => {
			util.advise( "hello world", { exit: true } );
			expect( process.exit ).toHaveBeenCalledTimes( 1 );
		} );

		it( "should call `process.exit` by default when no exit flag is passed", () => {
			util.advise( "hello world" );
			expect( process.exit ).toHaveBeenCalledTimes( 1 );
		} );

		it( "should call `process.exit` when cowsay fails", () => {
			cowsay.say = jest.fn( () => {
				throw new Error( "nope" );
			} );
			console.log = jest.fn( () => {} ); // eslint-disable-line no-console
			util.advise( "hello world", { exit: false } );
			expect( process.exit ).toHaveBeenCalledTimes( 1 );
			expect( console.log ).toHaveBeenCalledTimes( 1 ); // eslint-disable-line no-console
		} );
	} );
} );
