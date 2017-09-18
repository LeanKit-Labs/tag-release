#!/usr/bin/env node --harmony
/* eslint no-console: 0 */

import commander from "commander";
import _ from "lodash";
import utils from "./utils.js";
import chalk from "chalk";
import tagRelease from "./tag-release";
import help from "./help";
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
	.version( pkg.version )
	.option( "-r, --release [type]", "Release type (major, minor, patch, premajor, preminor, prepatch, prerelease)", /^(major|minor|patch|premajor|preminor|prepatch|prerelease)/i )
	.option( "-c, --config [filePath]", "Path to JSON Configuration file (defaults to './package.json')", /^.*\.json$/ )
	.option( "--verbose", "Console additional information" )
	.option( "-p, --prerelease", "Create a pre-release" )
	.option( "-i, --identifier <identifier>", "Identifier used for pre-release" )
	.option( "--reset", "Reset repo to upstream master/develop branches." )
	.option( "--promote [tag]", "Promotes specified pre-release tag to an offical release." )
	.option( "--continue", "Continues the rebase process of a tag promotion." )
	.option( "--qa [scope]", "Create initial upstream branch for lightning." )
	.option( "--pr [scope]", "Update lightning branch and create a PR to develop." );

commander.on( "--help", () => help() );

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
