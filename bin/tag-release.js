#!/usr/bin/env node
const commander = require("commander");
const pkg = require("../package.json");

commander
	.version(pkg.version)
	.command("start", "Default tag-release flow", { isDefault: true })
	.command("continue", "Continues the rebase process of a tag promotion.")
	.command(
		"config <filePath>",
		"Path to JSON Configuration file (defaults to './package.json')",
		/^.*\.json$/
	)
	.command(
		"dev",
		"Creates a PR from origin feature branch to upstream feature branch"
	)
	.command(
		"pr [scope]",
		"Update lightning branch and create a PR to develop."
	)
	.command("prerelease [identifier]", "Create a pre-release")
	.alias("pre")
	.command(
		"promote [tag]",
		"Promote a pre-release tag to an offical release."
	)
	.alias("pro")
	.command("qa [scope]", "Create initial upstream branch for lightning.")
	.command("reset", "Reset repo to upstream master/develop branches.")
	.parse(process.argv);
