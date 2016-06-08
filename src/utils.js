
import fs from "fs";
import childProcess from "child_process";
import inquirer from "inquirer";
import editor from "editor";
import logUpdate from "log-update";
import detectIndent from "detect-indent";
import { get } from "lodash";
import chalk from "chalk";

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
		return new Promise( ( resolve, reject ) => {
			this.exec( `${ GIT_CONFIG_COMMAND } ${ name }` )
				.then( value => resolve( value.trim() ) )
				.catch( error => reject( error ) );
		} );
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
		return Promise.all( [
			this.setGitConfig( "tag-release.username", username ),
			this.setGitConfig( "tag-release.token", token )
		] ).catch( e => chalk.red( e ) );
	},
	escapeCurlPassword( source ) {
		return source.replace( /([\[\]$"\\])/g, "\\$1" );
	},
	createGitHubAuthToken( username, password ) {
		return new Promise( function( resolve, reject ) { // eslint-disable-line
			password = this.escapeCurlPassword( password );
			const curl = `curl https://api.github.com/authorizations -u "${ username }:${ password }" -d '{ "scopes": [ "repo" ], "note": "tag-release-${ new Date().toISOString() }"}'`;
			this.exec( curl ).then( response => {
				resolve( JSON.parse( response ).token.trim() );
			} ).catch( e => reject( e ) );
		}.bind( this ) );
	}
};
