
import fs from "fs";
import childProcess from "child_process";
import inquirer from "inquirer";
import editor from "editor";
import logUpdate from "log-update";
import detectIndent from "detect-indent";
import { get } from "lodash";
import chalk from "chalk";
import logger from "better-console";
import request from "request";
import nodefn from "when/node";
import { extend } from "lodash";
import sequence from "when/sequence";
import currentPackage from "../package.json";

const GIT_CONFIG_COMMAND = "git config --global";

export default {
	readFile( path ) {
		try {
			return fs.readFileSync( path, "utf-8" );
		} catch ( exception ) {
			return "";
		}
	},
	readJSONFile( path ) {
		const content = this.readFile( path );
		return JSON.parse( content );
	},
	writeFile( path, content ) {
		return fs.writeFileSync( path, content, "utf-8" );
	},
	writeJSONFile( path, content ) {
		const file = fs.readFileSync( path, "utf-8" );
		const indent = detectIndent( file ).indent || "  ";
		content = `${ JSON.stringify( content, null, indent ) }\n`;
		return this.writeFile( path, content );
	},
	exec( command ) {
		return new Promise( ( resolve, reject ) =>
			childProcess.exec( command, ( error, stdout, stderr ) => {
				if ( error === null ) {
					resolve( stdout );
				} else {
					reject( error );
				}
			} )
		);
	},
	prompt( questions ) {
		return new Promise( ( resolve, reject ) =>
			inquirer.prompt( questions, answers => {
				resolve( answers );
			} )
		);
	},
	editor( data ) {
		const tempFilePath = "./.shortlog";

		return new Promise( ( resolve, reject ) => {
			this.writeFile( tempFilePath, data );
			editor( tempFilePath, ( code, sig ) => {
				if ( code === 0 ) {
					const contents = this.readFile( tempFilePath );
					fs.unlinkSync( tempFilePath );
					resolve( contents );
				} else {
					reject( `Unable to edit ${ tempFilePath }` );
				}
			} );
		} );
	},
	getPackageRegistry() {
		const pkg = this.readJSONFile( "./package.json" );
		const registry = get( pkg, "publishConfig.registry" );

		if ( registry ) {
			return Promise.resolve( registry );
		}

		const [ , scope ] = pkg.name.match( /(@.+)\/.+/ ) || []; // jscs:ignore
		const command = scope ?
			`npm get ${ scope }:registry` : `npm get registry`;
		return this.exec( command );
	},
	log: {
		lastLog: "",
		begin( text ) {
			logUpdate( `${ text } ☐` );
			this.lastLog = text;
		},
		end() {
			logUpdate( `${ this.lastLog } ☑` );
			logUpdate.done();
		}
	},
	getGitConfig( name ) {
		return this.exec( `${ GIT_CONFIG_COMMAND } ${ name }` )
			.then( value => value.trim() );
	},
	setGitConfig( name, value ) {
		return this.exec( `${ GIT_CONFIG_COMMAND } ${ name } ${ value.trim() }` );
	},
	getGitConfigs() {
		return Promise.all( [
			this.getGitConfig( "tag-release.username" ),
			this.getGitConfig( "tag-release.token" )
		] );
	},
	setGitConfigs( username, token ) {
		return sequence( [
			this.setGitConfig.bind( this, "tag-release.username", username ),
			this.setGitConfig.bind( this, "tag-release.token", token )
		] ).catch( e => logger.log( chalk.red( e ) ) );
	},
	escapeCurlPassword( source ) {
		return source.replace( /([\[\]$"\\])/g, "\\$1" );
	},
	createGitHubAuthToken( username, password, headers = {} ) {
		const CREATED = 201;
		const UNAUTHORIZED = 401;
		const url = "https://api.github.com/authorizations";
		const auth = { user: username, pass: password };
		const json = {
			scopes: [ "repo" ],
			note: `tag-release-${ new Date().toISOString() }`
		};
		headers = extend( { "User-Agent": "request" }, headers );
		return nodefn.lift( request.post )( { url, headers, auth, json } )
			.then( response => {
				response = response[ 0 ];
				const statusCode = response.statusCode;
				if ( statusCode === CREATED ) {
					return response.body.token;
				} else if ( statusCode === UNAUTHORIZED ) {
					return this.githubUnauthorized( username, password, response );
				}
				logger.log( response.body.message );
				const errors = response.body.errors || [];
				errors.forEach( error => logger.log( error.message ) );
			} )
			.catch( error => logger.log( "error", error ) );
	},
	githubUnauthorized( username, password, response ) {
		let twoFactorAuth = response.headers[ "x-github-otp" ] || "";
		twoFactorAuth = !!~twoFactorAuth.indexOf( "required;" );
		if ( twoFactorAuth ) {
			return this.prompt( [ {
				type: "input",
				name: "authCode",
				message: "What is your GitHub authentication code"
			} ] ).then( answers => {
				return this.createGitHubAuthToken( username, password, {
					"X-GitHub-OTP": answers.authCode
				} );
			} );
		}
		logger.log( response.body.message );
	},
	getCurrentVersion() {
		return currentPackage.version;
	}
};
