#!/usr/bin/env node
/* eslint no-console: 0 */
const commander = require("commander");
const _ = require("lodash");
const utils = require("../src/utils.js");
const help = require("../src/help");
const pkg = require("../package.json");
const path = require("path");
const logger = require("better-console");
const chalk = require("chalk");

const api = require("../src/index.js");

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
	.version(pkg.version)
	.option(
		"-r, --release [type]",
		"Release type (major, minor, patch, premajor, preminor, prepatch, prerelease)",
		/^(major|minor|patch|premajor|preminor|prepatch|prerelease)/i
	)
	.option(
		"-c, --config <filePath>",
		"Path to JSON Configuration file (defaults to './package.json')",
		/^.*\.json$/
	)
	.option(
		"--maxbuffer <n>",
		"Overrides the max stdout buffer of the child process. Size is 1024 * <n>.",
		parseInt
	)
	.option("--verbose", "Console additional information")
	.option("-p, --prerelease", "Create a pre-release")
	.option("-i, --identifier <identifier>", "Identifier used for pre-release")
	.option("--reset", "Reset repo to upstream master/develop branches.")
	.option(
		"--promote [tag]",
		"Promotes specified pre-release tag to an offical release."
	)
	.option("--continue", "Continues the rebase process of a tag promotion.")
	.option("--qa [scope]", "Create initial upstream branch for lightning.")
	.option(
		"--pr [scope]",
		"Update lightning branch and create a PR to develop."
	)
	.option(
		"--dev",
		"Creates a PR from origin feature branch to upstream feature branch"
	);

commander.on("--help", () => {
	help(commander);

	if (commander.verbose) {
		const diagramPath = path.resolve(__dirname, "workflow.txt");
		console.log(utils.readFile(diagramPath));
	} else {
		console.log(
			"  To get a flowchart included with --help add --verbose to the command"
		);
	}
});

commander.parse(process.argv);

if (commander.release) {
	_.remove(questions.general, { name: "release" });
}

const options = _.extend({}, commander);

const tagReleaseNext = chalk.green(`tag-release-next`);
logger.log(
	chalk.yellow(
		`${chalk.bold(
			`WARNING:`
		)} In an effort to move towards git-style commands we are deprecating
tag-release's current functionality of flags in future releases.
Please use ${tagReleaseNext} to get familiar with what lies ahead!
Try the "help" command to see example usage.`
	)
);

api.run(options);
