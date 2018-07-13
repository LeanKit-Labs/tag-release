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

const startTagRelease = options => {
	try {
		if (options.verbose) {
			fmt.title("GitHub Configuration");
			fmt.field("username", options.username);
			fmt.field("token", options.token);
			fmt.line();
		}

		options.configPath = options.config || "./package.json";

		if (!options.callback) {
			options.callback = () => console.log("Finished");
		}

		return sequence(options.workflow, options).then(result =>
			options.callback(result[result.length - 1])
		); // eslint-disable-line no-console
	} catch (error) {
		console.log(`Tag-release encountered a problem: ${error}`);
	}
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
				configPath: "./package.json",
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
