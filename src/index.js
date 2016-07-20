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

const questions = {
	general: [
		{
			type: "list",
			name: "release",
			message: "What type of release is this",
			choices: [
				{ name: "Major (Breaking Change)", value: "major", short: "l" },
				{ name: "Minor (New Feature)", value: "minor", short: "m" },
				{ name: "Patch (Bug Fix)", value: "patch", short: "s" }
			]
		}
	],
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
	.option( "-r, --release [type]", "Release type (major, minor, patch)", /^(major|minor|patch)/i )
	.option( "--verbose", "Console additional information" )
	.option( "-v", "Console the version of tag-release" );

commander.on( "--help", () => {
	console.log( "Examples: \n" );
	console.log( "   $ tag-release" );
	console.log( "   $ tag-release --release major" );
	console.log( "   $ tag-release -r minor" );
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

export function startTagRelease( options, queries = questions.general ) {
	if ( commander.verbose ) {
		fmt.title( "GitHub Configuration" );
		fmt.field( "username", options.username );
		fmt.field( "token", options.token );
		fmt.line();
	}
	return utils.prompt( queries ).then( answers => {
		answers = _.extend( {}, commander, answers, options );
		tagRelease( answers );
	} );
}

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
