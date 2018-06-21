#!/usr/bin/env node
/* eslint no-console: 0 */
const commander = require("commander");
const pkg = require("../package.json");
const path = require("path");
const help = require("../src/help");
const utils = require("../src/utils.js");

commander
	.version(pkg.version)
	.option("--verbose", "Console additional information", { noHelp: true })
	.command("start", "default", { isDefault: true, noHelp: true })
	.command("continue", "continue from a previously conflicted state")
	.command(
		"config <filePath>",
		"override .json configuration file path, defaults to './package.json'",
		/^.*\.json$/
	)
	.command(
		"dev",
		"create a PR from origin feature branch to upstream feature branch"
	)
	.command(
		"pr [scope]",
		"update consumer project feature branch and create a PR to develop"
	)
	.command("prerelease [identifier]", "create a pre-release")
	.alias("pre")
	.command(
		"promote [tag]",
		"promote a pre-release tag previously created by tag-release"
	)
	.alias("pro")
	.command(
		"qa [scope]",
		"create initial upstream feature branch for consumer project"
	)
	.command("reset", "reset repo to upstream master/develop branches");

commander.on("--help", () => {
	help(commander);

	if (commander.verbose) {
		const diagramPath = path.resolve(__dirname, "../src/workflow.txt");
		console.log(utils.readFile(diagramPath));
	} else {
		console.log(
			"  To get a flowchart included with --help add --verbose to the command"
		);
	}
});

commander.parse(process.argv);
