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
import sequence from "when/sequence";
import currentPackage from "../package.json";
import npm from "npm";
import semver from "semver";
import cowsay from "cowsay";
import advise from "./advise.js";

const GIT_CONFIG_COMMAND = "git config --global";

export default {
	readFile( path ) {
		if ( path ) {
			try {
				return fs.readFileSync( path, "utf-8" );
			} catch ( exception ) {
				return null;
			}
		}

		return null;
	},
	readJSONFile( path ) {
		const content = this.readFile( path ) || "{}";
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
	editLog( data ) {
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
	isPackagePrivate( configPath ) {
		const pkg = this.readJSONFile( configPath );
		return !!pkg.private;
	},
	getPackageRegistry( configPath ) {
		const pkg = this.readJSONFile( configPath );
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

		headers = Object.assign( {}, { "User-Agent": "request" }, headers );

		return new Promise( ( resolve, reject ) => {
			request.post( { url, headers, auth, json }, ( err, response, body ) => {
				if ( err ) {
					logger.log( "error", err );
					reject( err );
				}

				response = response[ 0 ];
				const { statusCode, errors } = response;

				if ( statusCode === CREATED ) {
					resolve( body.token );
				} else if ( statusCode === UNAUTHORIZED ) {
					resolve( this.githubUnauthorized( username, password, response ) );
				}

				// for any other HTTP status code...
				logger.log( body.message );

				if ( errors && errors.length ) {
					errors.forEach( error => logger.log( error.message ) );
				}

				resolve();
			} );
		} );
	},
	githubUnauthorized( username, password, response ) {
		let twoFactorAuth = response.headers[ "x-github-otp" ] || "";
		twoFactorAuth = twoFactorAuth.includes( "required;" );

		if ( twoFactorAuth ) {
			return this.prompt( [ {
				type: "input",
				name: "authCode",
				message: "What is the GitHub authentication code on your device"
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
	},
	getAvailableVersionInfo() {
		const packageName = "tag-release";
		const versionsLimit = 10;

		return new Promise( ( resolve, reject ) => {
			npm.load( { name: packageName, loglevel: "silent" }, loadErr => {
				if ( loadErr ) {
					reject( loadErr );
				}

				npm.commands.show( [ packageName, "versions" ], true, ( versionsErr, data ) => {
					if ( versionsErr ) {
						reject( versionsErr );
					}

					const tagReleaseVersions = data[ Object.keys( data )[ 0 ] ].versions;
					const fullVersions = tagReleaseVersions.filter( f => !f.includes( "-" ) ).slice( -versionsLimit );
					const prereleaseVersions = tagReleaseVersions.filter( f => f.includes( "-" ) ).slice( -versionsLimit );

					const latestFullVersion = fullVersions.reduce( ( memo, v ) => {
						return semver.gt( v, memo ) ? v : memo;
					}, fullVersions[ 0 ] );

					const latestPrereleaseVersion = prereleaseVersions.reduce( ( memo, prv ) => {
						return semver.gt( prv, memo ) ? prv : memo;
					}, prereleaseVersions[ 0 ] );

					resolve( {
						latestFullVersion,
						latestPrereleaseVersion
					} );
				} );
			} );
		} );
	},
	detectVersion() {
		const currentVersion = this.getCurrentVersion();

		const logVersionMessage = ( { availableVersionInfo, isRunningPrerelease } ) => {
			const { latestPrereleaseVersion, latestFullVersion } = availableVersionInfo;

			const logUpgradeCommand = upgradeTo => {
				const isPrerelease = upgradeTo.includes( "-" );
				const upgradeVersion = isPrerelease ? `@${ upgradeTo }` : "";
				const upgradeCommand = `'npm install -g tag-release${ upgradeVersion }'`;
				logger.log( chalk.red( `To upgrade, run ${ chalk.yellow( upgradeCommand ) }` ) );
			};

			const checkAgainstFullVersion = prerelease => {
				if ( semver.gt( latestFullVersion, currentVersion ) ) {
					logger.log( chalk.red( `There is an updated ${ prerelease ? "full " : "" }version (${ chalk.yellow( latestFullVersion ) }) of tag-release available.` ) );
					logUpgradeCommand( latestFullVersion );
					return Promise.resolve();
				}

				logger.log( chalk.green( `You're running the latest ${ prerelease ? "pre-release " : "" }version (${ chalk.yellow( currentVersion ) }) of tag-release.` ) );
				return Promise.resolve();
			};

			if ( isRunningPrerelease ) {
				if ( semver.gt( latestPrereleaseVersion, currentVersion ) ) {
					logger.log( chalk.red( `There is an updated pre-release version (${ chalk.yellow( latestPrereleaseVersion ) }) of tag-release available.` ) );
					logUpgradeCommand( latestPrereleaseVersion );
					return Promise.resolve();
				}

				return checkAgainstFullVersion( true );
			}

			return checkAgainstFullVersion( false );
		};

		return this.getAvailableVersionInfo().then( availableVersionInfo => {
			return logVersionMessage( { availableVersionInfo, isRunningPrerelease: currentVersion.includes( "-" ) } );
		} );
	},
	advise( text, { exit = true } = {} ) {
		logger.log( cowsay.say( {
			text: advise( text ),
			f: require( "path" ).resolve( __dirname, "clippy.cow" ) // eslint-disable-line
		} ) );

		if ( exit ) {
			process.exit( 0 ); // eslint-disable-line no-process-exit
		}
	}
};
