#!/usr/bin/env node --harmony
/* eslint no-console: 0 */

import commander from "commander";
import inquirer from "inquirer";
import _ from "lodash";
import tagRelease from "./tag-release";

const questions = [
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
	.option( "-r, --release [type]", "Release type", /^(major|minor|patch)/i );

commander.on( "--help", () => {
	console.log( "Examples: \n" );
	console.log( "   $ tag-release" );
	console.log( "   $ tag-release --release major" );
	console.log( "   $ tag-release -r minor" );
} );

commander.parse( process.argv );

if ( commander.release ) {
	_.remove( questions, { name: "release" } );
}

inquirer.prompt( questions, answers => {
	answers = _.extend( {}, commander, answers );

	tagRelease( answers );
} );
