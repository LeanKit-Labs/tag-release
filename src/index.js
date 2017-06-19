#!/usr/bin/env node --harmony
/* eslint no-console: 0 */

import commander from "commander";
import _ from "lodash";
import utils from "./utils.js";
import chalk from "chalk";
import tagRelease from "./tag-release";
import logger from "better-console";
import fmt from "fmt";
import pkg from "../package.json";
import sequence from "when/sequence";

const questions = {
	github: [
		{
			type: "input",
			name: "username",
			message: "What is your GitHub username"
		},
		{
			type: "password",
			name: "password",
			message: "What is your GitHub password"
		}
	]
};

commander
	.option( "-r, --release [type]", "Release type (major, minor, patch, premajor, preminor, prepatch, prerelease)", /^(major|minor|patch|premajor|preminor|prepatch|prerelease)/i )
	.option( "-c, --config [filePath]", "Path to JSON Configuration file (defaults to './package.json')", /^.*\.json$/ )
	.option( "--verbose", "Console additional information" )
	.option( "-v", "Console the version of tag-release" )
	.option( "-p, --prerelease", "Create a pre-release" )
	.option( "-i, --identifier <identifier>", "Identifier used for pre-release" )
	.option( "--reset", "Reset repo to upstream master/develop branches." );

commander.on( "--help", () => {
	console.log( "Examples: \n" );
	console.log( "   $ tag-release" );
	console.log( "   $ tag-release --config ../../config.json" );
	console.log( "   $ tag-release -c ./manifest.json" );
	console.log( "   $ tag-release --release major" );
	console.log( "   $ tag-release -r minor" );
	console.log( "   $ tag-release --prerelease" );
	console.log( "   $ tag-release -p -i rc" );
	console.log( "   $ tag-release --reset" );
	console.log( "   $ tag-release --verbose" );
	console.log( "   $ tag-release -v" );
} );

commander.on( "-v", () => {
	console.log( pkg.version );
	process.exit( 0 ); // eslint-disable-line
} );

commander.parse( process.argv );

if ( commander.release ) {
	_.remove( questions.general, { name: "release" } );
}

sequence( [ ::utils.detectVersion, bootstrap ] );

export function startTagRelease( options, queries = questions.general ) {
	if ( commander.verbose ) {
		fmt.title( "GitHub Configuration" );
		fmt.field( "username", options.username );
		fmt.field( "token", options.token );
		fmt.line();
	}

	options = _.extend( {}, commander, options );
	options.configPath = options.config || "./package.json";

	return tagRelease( options );
}

export function bootstrap() {
	utils.getGitConfigs()
		.then( ( [ username, token ] ) => startTagRelease( { username, token } ) )
		.catch( error => {
			utils.prompt( questions.github ).then( answers => {
				const { username, password } = answers;
				utils.createGitHubAuthToken( username, password ).then( token => {
					utils.setGitConfigs( username, token );
					startTagRelease( { username, token } );
				} ).catch( e => logger.log( chalk.red( "error", e ) ) );
			} );
		} );
}
