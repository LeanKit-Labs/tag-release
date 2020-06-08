#!/usr/bin/env node
/* eslint no-console: 0 */

const _ = require("lodash");
const utils = require("./utils.js");
const chalk = require("chalk");
const logger = require("better-console");
const fmt = require("fmt");
const sequence = require("when/sequence");
const { extend } = require("lodash");
const automatedWorkflow = require("../src/workflows/automated");
const setup = require("./helpers/setup");
const runWorkflow = require("./helpers/runWorkflow");

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

const startTagRelease = async options => {
	if (options.verbose) {
		fmt.title("GitHub Configuration");
		fmt.field("username", options.username);
		fmt.field("token", options.token);
		fmt.line();
	}

	await setup(options);

	return runWorkflow(options.workflow, options);
};

const bootstrap = options => {
	utils
		.getConfigs()
		.then(([username, token]) => {
			options = _.extend({}, options, { username, token });
			startTagRelease(options);
		})
		.catch(() => {
			utils.prompt(questions.github).then(answers => {
				const { username, password } = answers;
				utils
					.createGitHubAuthToken(username, password)
					.then(token => {
						utils.setConfigs(username, token);
						options = _.extend({}, options, {
							username,
							token
						});
						startTagRelease(options);
					})
					.catch(e => logger.log(chalk.red("error", e)));
			});
		});
};

const api = {
	async run({ release, cwd }) {
		if (!release || !cwd) {
			throw new Error("Missing required args: { release, cwd }");
		}

		const [username, token] = await utils.getConfigs();
		process.env.NO_OUTPUT = true;
		const options = extend(
			{},
			{ username, token },
			{
				release,
				cwd,
				workflow: automatedWorkflow
			}
		);

		const result = await sequence(options.workflow, options)
			.then(results => {
				const { currentVersion: tag } = results[results.length - 1];
				return { tag };
			})
			.catch(error => {
				throw new Error(error.message);
			});

		return result;
	},
	async cli(options) {
		await utils.detectVersion();
		await bootstrap(options);
	}
};

module.exports = api;
