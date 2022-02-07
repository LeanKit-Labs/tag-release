const fs = require("fs");
const childProcess = require("child_process");
const inquirer = require("inquirer");
const editor = require("editor");
const logUpdate = require("log-update");
const detectIndent = require("detect-indent");
const { get, uniqueId } = require("lodash");
const chalk = require("chalk");
const logger = require("better-console");
const sequence = require("when/sequence");
const currentPackage = require("../package.json");
const semver = require("semver");
const cowsay = require("cowsay");
const advise = require("./advise.js");
const rcfile = require("rcfile");
const pathUtils = require("path");

const GIT_CONFIG_COMMAND = "git config --global";
const GIT_CONFIG_UNSET_COMMAND = "git config --global --unset";
const GIT_CONFIG_REMOVE_SECTION_COMMAND =
	"git config --global --remove-section";
const MAX_BUFFER_SIZE = 5000; // eslint-disable-line no-magic-numbers

const getMaxBuffer = size => {
	return 1024 * size; // eslint-disable-line no-magic-numbers
};

const api = {
	readFile(path) {
		if (path) {
			try {
				return fs.readFileSync(path, "utf-8");
			} catch (exception) {
				return null;
			}
		}

		return null;
	},
	readJSONFile(path) {
		const content = api.readFile(path) || "{}";
		return JSON.parse(content);
	},
	writeFile(path, content) {
		return fs.writeFileSync(path, content, "utf-8");
	},
	writeJSONFile(path, content) {
		let indent = "  ";
		if (fs.existsSync(path)) {
			const file = fs.readFileSync(path, "utf-8");
			indent = detectIndent(file).indent || "  ";
		}
		content = `${JSON.stringify(content, null, indent)}\n`;
		return api.writeFile(path, content);
	},
	deleteFile(path) {
		return fs.existsSync(path) ? fs.unlinkSync(path) : Promise.resolve();
	},
	fileExists(path) {
		return fs.existsSync(path);
	},
	exec(command, size = MAX_BUFFER_SIZE) {
		const maxBuffer = getMaxBuffer(size);
		return new Promise((resolve, reject) =>
			childProcess.exec(command, { maxBuffer }, (error, stdout) => {
				if (error === null) {
					resolve(stdout);
				} else {
					reject(error);
				}
			})
		);
	},
	prompt(questions) {
		return new Promise(resolve =>
			inquirer.prompt(questions, answers => {
				resolve(answers);
			})
		);
	},
	editFile(data) {
		const filePath = uniqueId("./.editFile_");
		return new Promise((resolve, reject) => {
			api.writeFile(filePath, data);
			editor(filePath, code => {
				if (code === 0) {
					const contents = api.readFile(filePath);
					resolve(contents);
				} else {
					reject(`Unable to edit ${filePath}`);
				}
				fs.unlinkSync(filePath);
			});
		});
	},
	isPackagePrivate(configPath) {
		const pkg = api.readJSONFile(configPath);
		return !!pkg.private;
	},
	getPackageRegistry(configPath) {
		const pkg = api.readJSONFile(configPath);
		const registry = get(pkg, "publishConfig.registry");

		if (registry) {
			return Promise.resolve(registry);
		}

		const [, scope] = pkg.name.match(/(@.+)\/.+/) || []; // jscs:ignore
		const command = scope
			? `npm get ${scope}:registry`
			: `npm get registry`;
		return api.exec(command);
	},
	getPackageName(configPath) {
		const pkg = api.readJSONFile(configPath);
		return pkg.name;
	},
	log: {
		lastLog: "",
		begin(text) {
			if (!process.env.NO_OUTPUT) {
				logUpdate(`${text} ☐`);
				api.lastLog = text;
			}
		},
		end() {
			if (!process.env.NO_OUTPUT) {
				logUpdate(`${api.lastLog} ☑`);
				logUpdate.done();
			}
		}
	},
	logger: {
		log(text, error) {
			if (!process.env.NO_OUTPUT) {
				return error ? logger.log(text, error) : logger.log(text);
			}
		}
	},
	queryGitConfig(name) {
		return api
			.exec(`${GIT_CONFIG_COMMAND} ${name}`)
			.then(value => value.trim())
			.catch(() => undefined);
	},
	setConfig(name, value) {
		const path = pathUtils.join(process.env.HOME, ".tag-releaserc.json");
		const contents = api.readJSONFile(path);
		contents[name] = value;

		return api.writeJSONFile(path, contents);
	},
	removeGitConfig(name) {
		return api
			.exec(`${GIT_CONFIG_UNSET_COMMAND} ${name}`)
			.catch(() => undefined);
	},
	removeGitConfigSection(name) {
		return api.exec(`${GIT_CONFIG_REMOVE_SECTION_COMMAND} ${name}`);
	},
	getOverrides() {
		const path = pathUtils.join(process.env.HOME, ".tag-releaserc.json");
		let overrides = api.readJSONFile(path);

		// check if there are ENV variables for username/token
		if (process.env.LKR_GITHUB_USER && process.env.LKR_GITHUB_TOKEN) {
			overrides = Object.assign({}, overrides, {
				username: process.env.LKR_GITHUB_USER,
				token: process.env.LKR_GITHUB_TOKEN
			});
		}

		return overrides;
	},
	async getConfigs() {
		let [username, token] = await Promise.all([
			api.queryGitConfig("tag-release.username"),
			api.queryGitConfig("tag-release.token")
		]);

		if (username || token) {
			await Promise.all([
				api.setConfig("username", username),
				api.setConfig("token", token)
			]);
		}
		({ username, token } = api.getOverrides());

		if (username && token) {
			return Promise.resolve([username, token]);
		}
		return Promise.reject("username or token doesn't exist");
	},
	setConfigs(username, token) {
		return sequence([
			api.setConfig.bind(this, "username", username),
			api.setConfig.bind(this, "token", token)
		]).catch(e => api.logger.log(chalk.red(e)));
	},
	escapeCurlPassword(source) {
		return source.replace(/([[\]$"\\])/g, "\\$1");
	},
	getCurrentVersion() {
		return currentPackage.version;
	},
	getAvailableVersionInfo() {
		return new Promise((resolve, reject) => {
			const command = `npm show tag-release versions --json`;
			return api
				.exec(command)
				.then(result => {
					const parsedResult = JSON.parse(result);
					resolve({
						latestFullVersion: parsedResult
							.filter(i => !i.includes("-"))
							.slice(-1)[0],
						latestPrereleaseVersion: parsedResult
							.filter(i => i.includes("-"))
							.slice(-1)[0]
					});
				})
				.catch(e => {
					api.advise("availableVersions", { exit: false });
					reject(e);
				});
		});
	},
	detectVersion() {
		const currentVersion = api.getCurrentVersion();

		const logVersionMessage = ({
			availableVersionInfo,
			isRunningPrerelease
		}) => {
			const {
				latestPrereleaseVersion,
				latestFullVersion
			} = availableVersionInfo;

			const logUpgradeCommand = upgradeTo => {
				const isPrerelease = upgradeTo.includes("-");
				const upgradeVersion = isPrerelease ? `@${upgradeTo}` : "";
				const upgradeCommand = `'npm install -g tag-release${upgradeVersion}'`;
				api.logger.log(
					chalk.red(`To upgrade, run ${chalk.yellow(upgradeCommand)}`)
				);
			};

			const checkAgainstFullVersion = prerelease => {
				if (semver.gt(latestFullVersion, currentVersion)) {
					api.logger.log(
						chalk.red(
							`tag-release@${chalk.yellow(
								currentVersion
							)}: There is an updated ${
								prerelease ? "full " : ""
							}version (${chalk.yellow(
								latestFullVersion
							)}) available.`
						)
					);
					logUpgradeCommand(latestFullVersion);
					return Promise.resolve();
				}

				api.logger.log(
					chalk.green(
						`tag-release@${chalk.yellow(
							currentVersion
						)}: You're running the latest ${
							prerelease ? "pre-release " : ""
						}version.`
					)
				);
				return Promise.resolve();
			};

			if (isRunningPrerelease) {
				if (semver.gt(latestPrereleaseVersion, currentVersion)) {
					api.logger.log(
						chalk.red(
							`tag-release@${chalk.yellow(
								currentVersion
							)}: There is an updated pre-release version (${chalk.yellow(
								latestPrereleaseVersion
							)}) available.`
						)
					);
					logUpgradeCommand(latestPrereleaseVersion);
					return Promise.resolve();
				}

				return checkAgainstFullVersion(true);
			}

			return checkAgainstFullVersion(false);
		};

		return api.getAvailableVersionInfo().then(availableVersionInfo => {
			return logVersionMessage({
				availableVersionInfo,
				isRunningPrerelease: currentVersion.includes("-")
			});
		});
	},
	advise(text, { exit = true } = {}) {
		try {
			api.logger.log(
				cowsay.say({
					text: advise(text),
					f: pathUtils.resolve(__dirname, "clippy.cow") // eslint-disable-line
				})
			);
		} catch (error) {
			console.log(error); // eslint-disable-line no-console
			process.exit(0); // eslint-disable-line no-process-exit
		}

		if (exit) {
			if (process.env.NO_OUTPUT) {
				throw new Error(advise(text));
			} else {
				process.exit(0); // eslint-disable-line no-process-exit
			}
		}
	},
	hasLkScope() {
		const GET_LK_REGISTRY_SCOPE = "npm config get @banditsoftware:registry";
		const run = command =>
			childProcess
				.execSync(command)
				.toString()
				.trim();
		return run(GET_LK_REGISTRY_SCOPE) !== "undefined";
	},
	/* istanbul ignore next */
	renderHelpContent(content) {
		// mocking console.log is not awesome, and this function only exists
		// for the purpose of avoiding having to mock console.log in tests,
		// so we're just going to go ahead and safely ignore this in coverage

		/* istanbul ignore next */
		console.log(content); // eslint-disable-line no-console
	},
	applyCommanderOptions(commander) {
		commander.option("--verbose", "console additional information");
		commander.option(
			"--maxbuffer <n>",
			"overrides the max stdout buffer of the child process, size is 1024 * <n>",
			parseInt
		);
	},
	getScripts(command) {
		const content = rcfile("tag-release");
		return Object.keys(content)
			.filter(key => key === `pre${command}` || key === `post${command}`)
			.reduce(
				(res, key) => Object.assign(res, { [key]: content[key] }),
				{}
			);
	}
};

module.exports = api;
