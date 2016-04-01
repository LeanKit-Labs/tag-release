#!/usr/bin/env node --harmony
/* eslint no-console: 0 */

import commander from "commander";
import inquirer from "inquirer";
import _ from "lodash";
import tagRelease from "./tag-release";

const questions = [
	{
		type: "confirm",
		name: "develop",
		message: "Do you have a develop branch",
		default: true
	},
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
];

commander
	.option( "-d, --develop", "Develop branch" )
	.option( "-r, --release [type]", "Release type", /^(major|minor|patch)/i );

commander.on( "--help", () => {
	console.log( "Examples: \n" );
	console.log( "   $ tag-release" );
	console.log( "   $ tag-release --develop" );
	console.log( "   $ tag-release -d" );
	console.log( "   $ tag-release --release major" );
	console.log( "   $ tag-release -r minor" );
	console.log( "   $ tag-release -d -r patch" );
} );

commander.parse( process.argv );

if ( commander.develop ) {
	_.remove( questions, { name: "develop" } );
}

if ( commander.release ) {
	_.remove( questions, { name: "release" } );
}

inquirer.prompt( questions, answers => {
	answers = _.extend( {}, commander, answers );

	tagRelease( answers );
} );
