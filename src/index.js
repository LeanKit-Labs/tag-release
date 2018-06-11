#!/usr/bin/env node
/* eslint no-console: 0 */

const _ = require("lodash");
const utils = require("./utils.js");
const chalk = require("chalk");
const tagRelease = require("./tag-release");
const logger = require("better-console");
const fmt = require("fmt");

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

const api = {
	async run(options) {
		await utils.detectVersion();
		await api.bootstrap(options);
	},
	bootstrap(options) {
		utils
			.getGitConfigs()
			.then(([username, token]) => {
				options = _.extend({}, options, { username, token });
				api.startTagRelease(options);
			})
			.catch(() => {
				utils.prompt(questions.github).then(answers => {
					const { username, password } = answers;
					utils
						.createGitHubAuthToken(username, password)
						.then(token => {
							utils.setGitConfigs(username, token);
							options = _.extend({}, options, {
								username,
								token
							});
							api.startTagRelease(options);
						})
						.catch(e => logger.log(chalk.red("error", e)));
				});
			});
	},
	startTagRelease(options) {
		try {
			if (options.verbose) {
				fmt.title("GitHub Configuration");
				fmt.field("username", options.username);
				fmt.field("token", options.token);
				fmt.line();
			}

			options.configPath = options.config || "./package.json";

			return tagRelease(options).catch(error => {
				console.log(`Tag-release encountered a problem: ${error}`);
			});
		} catch (error) {
			console.log(`Tag-release encountered a problem: ${error}`);
		}
	}
};

module.exports = api;
