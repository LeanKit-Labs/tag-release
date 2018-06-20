/* eslint-disable max-lines */
const git = require("../../git");
const util = require("../../utils");
const semver = require("semver");
const chalk = require("chalk");
const GitHub = require("github-api");
const sequence = require("when/sequence");
const path = require("path");
const removeWords = require("remove-words");
const { set } = require("lodash");

const CHANGELOG_PATH = "./CHANGELOG.md";
const PACKAGELOCKJSON_PATH = "./package-lock.json";
const PULL_REQUEST_TEMPLATE_PATH = "./.github/PULL_REQUEST_TEMPLATE.md";

const api = {
	getFeatureBranch(state) {
		return git.getCurrentBranch().then(branch => {
			state.branch = branch.trim();
		});
	},
	gitFetchUpstream() {
		return git.fetchUpstream();
	},
	gitMergeUpstreamBranch(state) {
		const { branch } = state;
		return git.merge({
			branch,
			remote: "upstream",
			failHelpKey: "gitMergeUpstreamBranch"
		});
	},
	gitMergeUpstreamMaster() {
		return git.mergeUpstreamMaster();
	},
	gitMergeUpstreamDevelop(state) {
		const { hasDevelopBranch } = state;

		return hasDevelopBranch
			? git.mergeUpstreamDevelop()
			: Promise.resolve();
	},
	gitMergePromotionBranch(state) {
		return git.mergePromotionBranch(state.promote);
	},
	checkHasDevelopBranch(state) {
		return git
			.getRemoteBranches()
			.then(data => {
				const branches = data.split("\n");
				state.hasDevelopBranch = branches.some(branch =>
					branch.trim().includes("upstream/develop")
				);
			})
			.catch(() => {
				state.hasDevelopBranch = false;
			});
	},
	checkExistingPrereleaseIdentifier(state) {
		const { prerelease, currentVersion } = state;

		if (prerelease && prerelease.length) {
			return Promise.resolve();
		}

		const preReleaseRegEx = /^v?\d+\.\d+\.\d+-(.+)\.\d+$/;
		const [, id] = preReleaseRegEx.exec(currentVersion) || [];

		if (id) {
			state.prerelease = id;
			state.release = "prerelease";
		}

		return Promise.resolve();
	},
	setPrereleaseIdentifier(state) {
		const { prerelease } = state;

		const cleanIdentifier = targetIdentifier => {
			return targetIdentifier.replace(/^(defect|feature|rework)-/, "");
		};

		if (prerelease && prerelease.length) {
			state.prerelease = cleanIdentifier(state.prerelease);
			return Promise.resolve();
		}

		return util
			.prompt([
				{
					type: "input",
					name: "prereleaseIdentifier",
					message: "What is your pre-release Identifier?"
				}
			])
			.then(response => {
				state.prerelease = cleanIdentifier(
					response.prereleaseIdentifier
				);
				return Promise.resolve();
			});
	},
	selectPrereleaseToPromote(state) {
		if (state.promote && typeof state.promote === "boolean") {
			return git.getPrereleaseTagList().then(prereleases => {
				return util
					.prompt([
						{
							type: "list",
							name: "prereleaseToPromote",
							message:
								"Which pre-release do you wish to promote?",
							choices: prereleases
						}
					])
					.then(({ prereleaseToPromote: selectedPrerelease }) => {
						state.promote = selectedPrerelease;
						return Promise.resolve();
					});
			});
		}

		return Promise.resolve();
	},
	gitCheckoutMaster(state) {
		state.branch = "master";
		return git.checkoutMaster();
	},
	getCurrentBranchVersion(state) {
		const { configPath } = state;

		let pkg = {};
		try {
			pkg = util.readJSONFile(configPath);
		} catch (err) {
			util.advise("updateVersion");
		}

		state.currentVersion = pkg.version;
		return Promise.resolve();
	},
	gitShortLog(state) {
		const { currentVersion, prerelease } = state;

		let contents = util.readFile(CHANGELOG_PATH);

		if (contents.includes("### Next")) {
			contents = contents.replace(
				/### Next([^#]+)/,
				(match, submatch) => {
					state.log = submatch.trim();
					return "";
				}
			);

			util.writeFile(CHANGELOG_PATH, contents);
		} else {
			return git
				.getTagList()
				.then(tags => {
					let latestRelease = `v${currentVersion}`;
					if (tags.length) {
						if (!prerelease) {
							tags = tags.filter(tag => !tag.includes("-"));
							latestRelease = tags[tags.length - 1];
						}
					}

					return git.shortLog(latestRelease).then(data => {
						data = data.trim().replace(/^(.+)$/gm, "* $1");
						if (!data.length) {
							util.advise("gitLog.log", { exit: false });
						}

						state.log = data;
					});
				})
				.catch(() => util.advise("gitLog.log"));
		}
	},
	previewLog({ log }) {
		util.logger.log(`${chalk.bold("Here is a preview of your log:")}
${chalk.green(log)}`);
	},
	askSemverJump(state) {
		const { currentVersion, prerelease, release } = state;

		// don't bother prompting if this information was already provided in the CLI options
		if (release && release.length) {
			return Promise.resolve();
		}

		const releaseChoices = [
			{ name: "Major (Breaking Change)", value: "major", short: "l" },
			{ name: "Minor (New Feature)", value: "minor", short: "m" },
			{ name: "Patch (Bug Fix)", value: "patch", short: "s" }
		];

		const prereleaseChoices = [
			{
				name: "Pre-major (Breaking Change)",
				value: "premajor",
				short: "p-l"
			},
			{
				name: "Pre-minor (New Feature)",
				value: "preminor",
				short: "p-m"
			},
			{ name: "Pre-patch (Bug Fix)", value: "prepatch", short: "p-s" },
			{
				name: "Pre-release (Bump existing Pre-release)",
				value: "prerelease",
				short: "p-r"
			}
		];

		const choicesSource = prerelease ? prereleaseChoices : releaseChoices;

		const choices = choicesSource.map(item => {
			const version = `v${semver.inc(
				currentVersion,
				item.value,
				prerelease
			)}`;
			return Object.assign({}, item, {
				name: `${item.name} ${chalk.gray(version)}`
			});
		});

		return util
			.prompt([
				{
					type: "list",
					name: "release",
					message: "What type of release is this?",
					choices
				}
			])
			.then(answers => {
				state.release = answers.release;
				return Promise.resolve();
			});
	},
	updateLog(state) {
		return util
			.prompt([
				{
					type: "confirm",
					name: "log",
					message: "Would you like to edit your log?",
					default: true
				}
			])
			.then(answers => {
				util.log.begin("log preview");
				if (answers.log) {
					return util.editFile(state.log).then(data => {
						state.log = data.trim();
						util.log.end();
					});
				}

				return Promise.resolve();
			});
	},
	updateVersion(state) {
		const { configPath, currentVersion, prerelease, release } = state;

		let pkg = {};
		try {
			pkg = util.readJSONFile(configPath);
		} catch (err) {
			util.advise("updateVersion");
		}

		const oldVersion = currentVersion;
		const newVersion = (pkg.version = semver.inc(
			oldVersion,
			release,
			prerelease
		));

		util.writeJSONFile(configPath, pkg);
		state.versions = { oldVersion, newVersion };
		state.currentVersion = newVersion;
		util.logger.log(
			chalk.green(
				`Updated ${configPath} from ${oldVersion} to ${newVersion}`
			)
		);
	},
	updateChangelog(state) {
		const { log, release, versions: { newVersion } } = state;
		const version = `### ${newVersion}`;
		const update = `${version}\n\n${log}`;
		const wildcardVersion = newVersion.replace(/\.\d+\.\d+/, ".x");
		const command = "update changelog";

		util.log.begin(command);
		let contents = util.readFile(CHANGELOG_PATH);

		if (release === "major") {
			contents = `## ${wildcardVersion}\n\n${update}\n\n${contents}`;
		} else {
			contents = contents
				? contents.replace(/(## .*\n)/, `$1\n${update}\n`)
				: `## ${wildcardVersion}\n\n${update}\n`;
		}

		util.writeFile(CHANGELOG_PATH, contents);
		util.log.end();
	},
	gitDiff(state) {
		const { configPath } = state;
		const files = [CHANGELOG_PATH, configPath];

		if (util.fileExists(PACKAGELOCKJSON_PATH)) {
			files.push(PACKAGELOCKJSON_PATH);
		}

		const onError = err => {
			return () => {
				let failHelpKey = "gitCommandFailed";
				if (err.message.includes("maxBuffer exceeded")) {
					failHelpKey = "maxBufferExceeded";
				}

				util.advise(failHelpKey);
				return Promise.reject();
			};
		};

		return git
			.diff({ files, maxBuffer: state.maxbuffer, onError })
			.then(diff => {
				util.logger.log(diff);
				return util
					.prompt([
						{
							type: "confirm",
							name: "proceed",
							message: "Are you OK with this diff?",
							default: true
						}
					])
					.then(answers => {
						util.log.begin("confirming changes to commit");
						util.log.end();

						if (!answers.proceed) {
							process.exit(0); // eslint-disable-line no-process-exit
						}
					});
			});
	},
	gitAdd(state) {
		const { configPath } = state;
		const files = [CHANGELOG_PATH, configPath];

		if (util.fileExists(PACKAGELOCKJSON_PATH)) {
			files.push(PACKAGELOCKJSON_PATH);
		}

		return git.add(files);
	},
	gitStageConfigFile(state) {
		const { configPath } = state;

		return git.add([configPath]);
	},
	gitCommit(state) {
		const { versions: { newVersion } } = state;

		return git.commit(newVersion);
	},
	gitTag(state) {
		const { versions: { newVersion } } = state;
		const tag = `v${newVersion}`;

		return git.tag(tag, tag);
	},
	gitPushUpstreamMaster() {
		return git.pushUpstreamMasterWithTags();
	},
	npmPublish(state) {
		const { configPath, prerelease } = state;
		if (configPath !== "./package.json") {
			return null;
		}

		let command = "npm publish";
		command = prerelease ? `${command} --tag ${prerelease}` : command;

		if (!util.isPackagePrivate(configPath)) {
			return util
				.getPackageRegistry(configPath)
				.then(registry => {
					return util
						.prompt([
							{
								type: "confirm",
								name: "publish",
								message: `Do you want to publish this package to ${registry}?`,
								default: true
							}
						])
						.then(answers => {
							if (answers.publish) {
								util.log.begin(command);
								return util
									.exec(command)
									.then(() => util.log.end())
									.catch(() =>
										util.advise("npmPublish", {
											exit: false
										})
									);
							}
						});
				})
				.catch(err => util.logger.log(chalk.red(err)));
		}
	},
	gitCheckoutDevelop(state) {
		const { hasDevelopBranch } = state;

		if (hasDevelopBranch) {
			return git.checkoutDevelop();
		}
	},
	gitMergeMaster(state) {
		const { hasDevelopBranch } = state;

		if (hasDevelopBranch) {
			return git.mergeMaster();
		}
	},
	gitPushUpstreamDevelop(state) {
		const { hasDevelopBranch } = state;

		if (hasDevelopBranch) {
			return git.pushUpstreamDevelop();
		}
	},
	gitPushUpstreamFeatureBranch(state) {
		const { branch } = state;

		if (branch && branch.length) {
			return git.push({ branch, remote: "upstream" });
		}
	},
	gitForcePushUpstreamFeatureBranch(state) {
		const { branch } = state;

		if (branch && branch.length) {
			return git.push({ branch: `-f ${branch}`, remote: "upstream" });
		}
	},
	gitPushOriginMaster() {
		return git.pushOriginMaster();
	},
	githubUpstream(state) {
		const command = `git config remote.upstream.url`;
		return util
			.exec(command)
			.then(data => {
				const [, owner, name] =
					data.match(/github\.com[:/](.*)\/(.*(?=\.git)|(?:.*))/) ||
					[];
				state.github = Object.assign({}, state.github, {
					upstream: { owner, name }
				});
			})
			.catch(error => util.logger.log("error", error));
	},
	githubOrigin(state) {
		const command = `git config remote.origin.url`;
		return util
			.exec(command)
			.then(data => {
				set(state, "remotes.origin.url", data.trim());

				const [, owner, name] =
					data.match(/github\.com[:/](.*)\/(.*(?=\.git)|(?:.*))/) ||
					[];
				state.github = Object.assign({}, state.github, {
					origin: { owner, name }
				});
			})
			.catch(error => util.logger.log("error", error));
	},
	githubRelease(state) {
		const {
			github: {
				upstream: { owner: repositoryOwner, name: repositoryName }
			},
			log,
			prerelease,
			token,
			versions: { newVersion }
		} = state;
		const tagName = `v${newVersion}`;
		const github = new GitHub({ token });
		const defaultName = log
			.split("\n")
			.pop()
			.replace("* ", "");
		const questions = [
			{
				type: "input",
				name: "name",
				message: "What do you want to name the release?",
				default: defaultName
			}
		];

		const method = process.env.NO_OUTPUT
			? () => Promise.resolve({ name: defaultName })
			: args => util.prompt(args);

		return method(questions).then(answers => {
			util.log.begin("release to github");
			const repository = github.getRepo(repositoryOwner, repositoryName);
			const args = {
				tag_name: tagName, // eslint-disable-line
				name: answers.name,
				body: log,
				prerelease: !!prerelease
			};

			return repository
				.createRelease(args)
				.then(response => {
					util.log.end();
					util.logger.log(
						chalk.yellow(
							chalk.underline(chalk.bold(response.data.html_url))
						)
					);
					return Promise.resolve(state);
				})
				.catch(err => util.logger.log(chalk.red(err)));
		});
	},
	checkForUncommittedChanges(state) {
		return git.uncommittedChangesExist().then(results => {
			state.uncommittedChangesExist = results.length;
			return Promise.resolve(state.uncommittedChangesExist);
		});
	},
	gitStash() {
		return git.stash().then(() => {
			util.advise("gitStash", { exit: false });
			return Promise.resolve();
		});
	},
	stashIfUncommittedChangesExist(state) {
		const { uncommittedChangesExist } = state;
		if (uncommittedChangesExist) {
			return api.gitStash();
		}
	},
	verifyMasterBranch() {
		return git.branchExists("master").then(exists => {
			if (!exists) {
				return git.createLocalBranch("master");
			}
		});
	},
	verifyDevelopBranch(state) {
		return git.branchExists("develop").then(exists => {
			if (!exists && state.hasDevelopBranch) {
				return git.createLocalBranch("develop");
			}
		});
	},
	gitResetMaster() {
		return git.resetBranch("master");
	},
	gitResetDevelop(state) {
		if (state.hasDevelopBranch) {
			return git.resetBranch("develop");
		}
		return Promise.resolve();
	},
	gitCheckoutTag(state) {
		if (state.promote.charAt(0) !== "v") {
			state.promote = `v${state.promote}`;
		}

		return git.checkoutTag(state.promote);
	},
	gitGenerateRebaseCommitLog() {
		return git.generateRebaseCommitLog();
	},
	gitRemovePreReleaseCommits() {
		return git.removePreReleaseCommits();
	},
	gitRebaseUpstreamMaster() {
		return git.rebaseUpstreamMaster();
	},
	gitRemovePromotionBranches() {
		return git.removePromotionBranches();
	},
	gitStageFiles() {
		return git.stageFiles();
	},
	gitRebaseContinue() {
		return git.rebaseContinue();
	},
	setPromote(state) {
		state.promote = state.branch.slice(
			state.branch.indexOf("v"),
			state.branch.length
		); // retrieve from promote-release branch, e.g. v1.1.1-feature.0
		return Promise.resolve();
	},
	getPackageScope(state) {
		const defaultOrProvidedScope = flag => {
			return flag.charAt(0) === "@" ? `${flag}` : `@${flag}`;
		};
		const content = util.readJSONFile(path.join(__dirname, ".state.json"));
		state.scope = content.scope ? content.scope : "@lk";

		if (state.qa && typeof state.qa !== "boolean") {
			state.scope = defaultOrProvidedScope(state.qa);
		} else if (state.pr && typeof state.pr !== "boolean") {
			state.scope = defaultOrProvidedScope(state.pr);
		}

		return Promise.resolve();
	},
	getScopedRepos(state) {
		const { configPath, scope } = state;
		try {
			let content = {};
			content = util.readJSONFile(configPath);

			const getScopedDependencies = (dependencies = {}, packageScope) =>
				Object.keys(dependencies).filter(key =>
					key.includes(packageScope)
				);

			let repos = getScopedDependencies(content.devDependencies, scope);
			repos = [
				...repos,
				...getScopedDependencies(content.dependencies, scope)
			];
			repos = repos.map(key => key.replace(`${scope}/`, ""));

			if (repos.length === 0) {
				util.advise("noPackagesInScope");
				process.exit(0); // eslint-disable-line no-process-exit
			}

			return Promise.resolve(repos);
		} catch (err) {
			util.advise("updateVersion");
		}

		return Promise.resolve();
	},
	askReposToUpdate(state) {
		return api.getScopedRepos(state).then(packages => {
			return util
				.prompt([
					{
						type: "checkbox",
						name: "packagesToPromote",
						message: "Which package(s) do you wish to update?",
						choices: packages
					}
				])
				.then(({ packagesToPromote }) => {
					state.packages = packagesToPromote;
					return Promise.resolve();
				});
		});
	},
	askVersion(state, dependency) {
		const { pkg, version } = dependency;
		return () => {
			return api.getTagsFromRepo(state, pkg).then(tags => {
				return util
					.prompt([
						{
							type: "list",
							name: "tag",
							message: `Update ${chalk.yellow(
								pkg
							)} from ${chalk.yellow(version)} to:`,
							choices: tags
						}
					])
					.then(({ tag }) => {
						return Promise.resolve({ pkg, version: tag });
					});
			});
		};
	},
	askVersions(state) {
		const { dependencies } = state;
		const prompts = dependencies.map(dependency =>
			api.askVersion(state, dependency)
		);

		return sequence(prompts).then(deps => {
			state.dependencies = deps;

			const tagIdentifier = /^\d+\.\d+\.\d+-(.+)\.\d+$/;
			state.prerelease =
				deps.reduce((memo, dep) => {
					const { version } = dep;
					const [tag, identifier] = tagIdentifier.exec(version) || [];
					if (tag && identifier && !memo.includes(identifier)) {
						memo.push(identifier);
					}
					return memo;
				}, [])[0] || "";

			if (!state.prerelease) {
				state.prerelease = removeWords(state.changeReason).join("-");
			}

			return Promise.resolve();
		});
	},
	askChangeType(state) {
		const { keepBranch } = state;

		if (keepBranch) {
			return Promise.resolve();
		}

		return util
			.prompt([
				{
					type: "list",
					name: "changeType",
					message: "What type of change is this work?",
					choices: ["feature", "defect", "rework"]
				}
			])
			.then(({ changeType }) => {
				state.changeType = changeType;
				return Promise.resolve();
			});
	},
	changeReasonValidator(changeReason) {
		return changeReason.trim().length > 0;
	},
	askChangeReason(state) {
		return util
			.prompt([
				{
					type: "input",
					name: "changeReason",
					message: `What is the reason for this change? ${chalk.red(
						"(required)"
					)}`,
					validate: api.changeReasonValidator
				}
			])
			.then(({ changeReason }) => {
				state.changeReason = changeReason.replace(/["]+/g, "");
				return Promise.resolve();
			});
	},
	gitCheckoutAndCreateBranch(state) {
		const { branch, keepBranch } = state;

		const onError = err => {
			return () => {
				let failHelpKey = "gitCommandFailed";
				const msg = `A branch named '${branch}' already exists`;
				if (err.message.includes(msg)) {
					failHelpKey = "gitBranchAlreadyExists";
				}

				util.advise(failHelpKey);
				return Promise.reject();
			};
		};

		const result = keepBranch
			? () => Promise.resolve()
			: () => git.checkoutAndCreateBranch({ branch, onError });

		return result();
	},
	updateDependencies(state) {
		const { dependencies, configPath, scope } = state;
		try {
			let content = {};
			content = util.readJSONFile(configPath);

			dependencies.forEach(item => {
				const key = `${scope}/${item.pkg}`;
				if (content.devDependencies && key in content.devDependencies) {
					content.devDependencies[key] = item.version;
				}
				if (content.dependencies && key in content.dependencies) {
					content.dependencies[key] = item.version;
				}
			});

			util.writeJSONFile(configPath, content);
		} catch (err) {
			util.advise("updateVersion");
		}

		return Promise.resolve();
	},
	gitCommitBumpMessage(state) {
		const { dependencies, changeReason } = state;
		const arr = [];
		dependencies.forEach(item => {
			arr.push(`${item.pkg} to ${item.version}`);
		});

		state.bumpComment = `Bumped ${arr.join(", ")}: ${changeReason}`;

		return git.commit(state.bumpComment);
	},
	verifyPackagesToPromote(state) {
		const { packages } = state;
		if (packages && packages.length === 0) {
			util.advise("noPackages");
			process.exit(0); // eslint-disable-line no-process-exit
		}

		return Promise.resolve();
	},
	gitRebaseUpstreamBranch(state) {
		const { branch } = state;
		return git.rebaseUpstreamBranch({ branch });
	},
	gitRebaseUpstreamDevelop() {
		return git.rebaseUpstreamDevelop();
	},
	getReposFromBumpCommit(state) {
		return git.getLatestCommitMessage().then(msg => {
			const [, versions = "", reason = ""] =
				msg.match(/Bumped (.*): (.*)/) || [];
			const repoVersion = /([\w-]+) to ([\d.]+)/;
			const results = versions.split(",").reduce((memo, bump) => {
				const [, repo, version] = repoVersion.exec(bump) || [];
				if (repo && version) {
					memo.push(repo);
				}
				return memo;
			}, []);

			state.packages = results;
			state.changeReason = reason;

			return Promise.resolve();
		});
	},
	gitAmendCommitBumpMessage(state) {
		const { dependencies, changeReason } = state;
		const arr = [];
		dependencies.forEach(item => {
			arr.push(`${item.pkg} to ${item.version}`);
		});

		state.bumpComment = `Bumped ${arr.join(", ")}: ${changeReason}`;

		return git.amend(state.bumpComment);
	},
	getCurrentDependencyVersions(state) {
		const { packages, configPath, scope } = state;
		state.dependencies = [];

		try {
			let content = {};
			content = util.readJSONFile(configPath);

			packages.forEach(pkg => {
				const key = `${scope}/${pkg}`;
				if (content.devDependencies && key in content.devDependencies) {
					state.dependencies.push({
						pkg,
						version: content.devDependencies[key]
					});
				}
				if (content.dependencies && key in content.dependencies) {
					state.dependencies.push({
						pkg,
						version: content.dependencies[key]
					});
				}
			});
		} catch (err) {
			util.advise("updateVersion");
		}

		return Promise.resolve();
	},
	createGithubPullRequestAganistDevelop(state) {
		const {
			github: {
				upstream: { owner: repositoryOwner, name: repositoryName }
			},
			token,
			branch
		} = state;
		const github = new GitHub({ token });
		util.log.begin("creating pull request to github");

		const repository = github.getRepo(repositoryOwner, repositoryName);

		const [, , reason = ""] =
			state.bumpComment.match(/Bumped (.*): (.*)/) || [];
		const options = {
			title: reason,
			head: `${repositoryOwner}:${branch}`,
			base: "develop"
		};

		return repository
			.createPullRequest(options)
			.then(response => {
				const { number, html_url: url } = response.data; // eslint-disable-line camelcase
				const issues = github.getIssues(
					repositoryOwner,
					repositoryName
				);
				return issues
					.editIssue(number, {
						labels: ["Ready to Merge Into Develop"]
					})
					.then(() => {
						util.log.end();
						util.logger.log(chalk.yellow.underline.bold(url));
					})
					.catch(err => util.logger.log(chalk.red(err)));
			})
			.catch(err => util.logger.log(chalk.red(err)));
	},
	createGithubPullRequestAganistBranch(state) {
		const {
			github: {
				upstream: {
					owner: repositoryUpstreamOwner,
					name: repositoryUpstreamName
				},
				origin: { owner: repositoryOriginOwner }
			},
			token,
			branch,
			pullRequest: { title, body }
		} = state;
		const github = new GitHub({ token });
		util.log.begin("creating pull request to github");

		const repository = github.getRepo(
			repositoryUpstreamOwner,
			repositoryUpstreamName
		);

		const options = {
			title,
			body,
			head: `${repositoryOriginOwner}:${branch}`,
			base: `${branch}`
		};

		return repository
			.createPullRequest(options)
			.then(response => {
				const { number, html_url: url } = response.data; // eslint-disable-line camelcase
				const issues = github.getIssues(
					repositoryUpstreamOwner,
					repositoryUpstreamName
				);
				return issues
					.editIssue(number, { labels: ["Needs Developer Review"] })
					.then(() => {
						util.log.end();
						util.logger.log(chalk.yellow.underline.bold(url));
					})
					.catch(err => util.logger.log(chalk.red(err)));
			})
			.catch(err => util.logger.log(chalk.red(err)));
	},
	saveState(state) {
		const { scope } = state;
		try {
			const content = {
				scope
			};

			util.writeJSONFile(path.join(__dirname, ".state.json"), content);
		} catch (err) {
			util.advise("saveState");
		}

		return Promise.resolve();
	},
	cleanUpTmpFiles() {
		util.deleteFile(path.join(__dirname, ".state.json"));
		util.deleteFile(path.join(__dirname, ".dependencies.json"));

		return git.cleanUp();
	},
	promptBranchName(state) {
		const { keepBranch, changeType, prerelease } = state;

		if (keepBranch) {
			return Promise.resolve();
		}
		return util
			.prompt([
				{
					type: "input",
					name: "branchName",
					message: "What do you want your branch name to be?",
					default: `${changeType}-${prerelease}`
				}
			])
			.then(({ branchName }) => {
				state.branch = branchName;
				return Promise.resolve();
			});
	},
	gitCheckoutBranch(state) {
		return git.checkoutBranch(state.branch);
	},
	getTagsFromRepo(state, repositoryName) {
		const {
			github: { upstream: { owner: repositoryOwner } },
			token
		} = state;
		const github = new GitHub({ token });

		const repository = github.getRepo(repositoryOwner, repositoryName);

		return repository
			.listTags()
			.then(response => {
				const tags = response.data.map(item => {
					return item.name.slice(1, item.name.length); // slice off the 'v' that is returned in the tag
				});
				return tags;
			})
			.catch(err => util.logger.log(chalk.red(err)));
	},
	verifyRemotes(state) {
		const command = `git remote`;
		return util.exec(command).then(response => {
			state.remotes = {
				origin: {
					exists: response.includes("origin")
				},
				upstream: {
					exists: response.includes("upstream")
				}
			};
		});
	},
	verifyOrigin(state) {
		const { remotes: { origin } } = state;
		util.log.begin("Verifying origin remote");

		if (!origin.exists) {
			util.advise("gitOrigin");
		}

		util.log.end();
		return Promise.resolve();
	},
	verifyUpstream(state) {
		const {
			github: {
				origin: { owner: repositoryOwner, name: repositoryName }
			},
			token,
			remotes: { origin, upstream }
		} = state;
		util.log.begin("Verifying upstream remote");

		if (!upstream.exists) {
			util.log.end();
			util.log.begin("Creating upstream remote");
			const github = new GitHub({ token });

			const repository = github.getRepo(repositoryOwner, repositoryName);

			return repository
				.getDetails()
				.then(response => {
					let parentSshUrl;
					if (response.data.hasOwnProperty("parent")) {
						parentSshUrl = origin.url.includes("https")
							? response.data.parent.svn_url
							: response.data.parent.ssh_url;
					} else {
						parentSshUrl = origin.url.includes("https")
							? response.data.svn_url
							: response.data.ssh_url;
					}
					const command = `git remote add upstream ${parentSshUrl}`;
					return util
						.exec(command)
						.then(util.log.end())
						.catch(err => util.logger.log(chalk.red(err)));
				})
				.catch(err => util.logger.log(chalk.red(err)));
		}

		util.log.end();
		return Promise.resolve();
	},
	verifyChangelog() {
		util.log.begin("Verifying CHANGELOG.md");
		if (util.fileExists(CHANGELOG_PATH)) {
			util.log.end();
			return Promise.resolve();
		}
		util.log.end();

		return util
			.prompt([
				{
					type: "confirm",
					name: "changelog",
					message: "Would you like us to create a CHANGELOG.md?",
					default: true
				}
			])
			.then(answers => {
				if (answers.changelog) {
					util.log.begin("Creating CHANGELOG.md");
					util.log.end();
					return util.writeFile(CHANGELOG_PATH, "");
				}

				return Promise.resolve();
			});
	},
	verifyPackageJson(state) {
		const { configPath } = state;
		util.log.begin("Verifying package.json");
		util.log.end();

		if (!util.fileExists(configPath)) {
			util.advise("missingPackageJson");
		}

		return Promise.resolve();
	},
	isPackagePrivate(state) {
		const { configPath } = state;
		if (util.isPackagePrivate(configPath)) {
			util.advise("privatePackage");
		}

		return Promise.resolve();
	},
	checkNewCommits(state) {
		const { currentVersion } = state;
		const latestRelease = `v${currentVersion}`;

		return git.shortLog(latestRelease).then(data => {
			state.log = data;
		});
	},
	useCurrentBranchOrCheckoutDevelop(state) {
		const { log, hasDevelopBranch } = state;

		let result;
		if (log.length) {
			result = () => Promise.resolve();
		} else if (hasDevelopBranch) {
			result = () => git.checkoutDevelop();
		} else {
			result = () => util.advise("qaNoChangeNoDevelop");
		}

		return result();
	},
	promptKeepBranchOrCreateNew(state) {
		const { log, branch } = state;

		if (!log.length) {
			return Promise.resolve();
		}

		return util
			.prompt([
				{
					type: "confirm",
					name: "keep",
					message: "Would you like to use your current branch?",
					default: true
				}
			])
			.then(answers => {
				state.keepBranch = answers.keep;
				return git
					.branchExistsRemote({ branch, remote: "upstream" })
					.then(exists => {
						if (exists) {
							return git.merge({
								branch,
								remote: "upstream",
								failHelpKey: "gitMergeUpstreamBranch"
							});
						}
					});
			});
	},
	findBranchByTag(state) {
		const { promote: tag } = state;
		return git.getAllBranchesWithTag(tag).then(response => {
			const regexp = /[^*/ ]+$/;

			let branches = response.split("\n").filter(b => b);

			branches = branches.reduce((memo, branch) => {
				branch = branch.trim();
				const [myBranch] = regexp.exec(branch) || [];

				if (!memo.includes(myBranch)) {
					memo.push(myBranch);
				}

				return memo;
			}, []);

			if (branches.length > 1) {
				return util
					.prompt([
						{
							type: "list",
							name: "branch",
							message:
								"Which branch contains the tag you are promoting?",
							choices: branches
						}
					])
					.then(({ branch }) => {
						state.branchToRemove = branch;
						return Promise.resolve();
					});
			}

			state.branchToRemove = branches[0];
			return Promise.resolve();
		});
	},
	deleteLocalFeatureBranch(state) {
		const { branchToRemove: branch } = state;

		const onError = () => {
			return () => Promise.resolve();
		};

		return git.deleteBranch(
			branch,
			true,
			"Cleaning local feature branch",
			onError
		);
	},
	deleteUpstreamFeatureBranch(state) {
		const { branchToRemove: branch } = state;

		const onError = () => {
			return () => Promise.resolve();
		};

		return git.deleteBranchUpstream(
			branch,
			true,
			"Cleaning upstream feature branch",
			onError
		);
	},
	saveDependencies(state) {
		const { dependencies, changeReason } = state;

		try {
			const content = {
				dependencies,
				changeReason
			};

			util.writeJSONFile(
				path.join(__dirname, ".dependencies.json"),
				content
			);
		} catch (err) {
			util.advise("saveDependencies");
		}

		return Promise.resolve();
	},
	getDependenciesFromFile(state) {
		const content = util.readJSONFile(
			path.join(__dirname, ".dependencies.json")
		);

		if (content) {
			Object.assign(state, content);
		}

		return Promise.resolve();
	},
	updatePackageLockJson(state) {
		const { dependencies, currentVersion, scope } = state;

		if (util.fileExists(PACKAGELOCKJSON_PATH)) {
			if (currentVersion) {
				let pkg = {};
				pkg = util.readJSONFile(PACKAGELOCKJSON_PATH);
				pkg.version = currentVersion;
				util.writeJSONFile(PACKAGELOCKJSON_PATH, pkg);
			}

			if (dependencies) {
				const installs = dependencies.map(dep =>
					api.npmInstallPackage(`${scope}/${dep.pkg}@${dep.version}`)
				);
				return sequence(installs).then(() => Promise.resolve());
			}
		}
		return Promise.resolve();
	},
	npmInstallPackage(dependency) {
		const command = `npm install ${dependency} -E`;

		return () => {
			util.log.begin(command);
			return util
				.exec(command)
				.then(() => {
					util.log.end();
					return Promise.resolve();
				})
				.catch(() => {
					util.log.end();
					util.advise("npmInstall", { exit: false });
				});
		};
	},
	gitCreateBranchUpstream(state) {
		const { hasDevelopBranch, branch } = state;
		const remote = "upstream";

		return git.branchExistsRemote({ branch, remote }).then(exists => {
			if (!exists) {
				const base = hasDevelopBranch ? "develop" : "master";
				return git.createRemoteBranch({ branch, remote, base });
			}
		});
	},
	gitCreateBranchOrigin(state) {
		const { branch } = state;
		const remote = "origin";

		const onError = () => {
			util.advise("remoteBranchOutOfDate", { exit: false });
			return () => Promise.resolve();
		};

		return git.branchExistsRemote({ branch, remote }).then(exists => {
			if (!exists) {
				return git.createRemoteBranch({
					branch,
					remote: "origin",
					base: branch
				});
			}
			return git.pushRemoteBranch({ branch, remote, onError });
		});
	},
	updatePullRequestTitle(state) {
		return git.getLastCommitText().then(commitText => {
			const questions = [
				{
					type: "input",
					name: "title",
					message: "What is the title of your pull request?",
					default: commitText.trim()
				}
			];

			return util.prompt(questions).then(response => {
				state.pullRequest = Object.assign({}, state.pullRequest, {
					title: response.title.trim()
				});
			});
		});
	},
	updatePullRequestBody(state) {
		return util
			.prompt([
				{
					type: "confirm",
					name: "body",
					message:
						"Would you like to edit the body of your pull request?",
					default: true
				}
			])
			.then(answers => {
				util.log.begin("pull request body preview");
				const contents = util.fileExists(PULL_REQUEST_TEMPLATE_PATH)
					? util.readFile(PULL_REQUEST_TEMPLATE_PATH)
					: "";
				if (answers.body) {
					return util.editFile(contents).then(data => {
						state.pullRequest = Object.assign(
							{},
							state.pullRequest,
							{
								body: data.trim()
							}
						);
						util.log.end();
					});
				}

				state.pullRequest = Object.assign({}, state.pullRequest, {
					body: contents.trim()
				});
				return Promise.resolve();
			});
	},
	gitCheckoutDevelopOrMaster(state) {
		const { hasDevelopBranch } = state;

		if (hasDevelopBranch) {
			return git.checkoutDevelop();
		}

		return git.checkoutMaster();
	},
	gitRebaseUpstreamDevelopOrMaster(state) {
		const { hasDevelopBranch } = state;

		if (hasDevelopBranch) {
			return git.rebaseUpstreamDevelop();
		}

		return git.rebaseUpstreamMaster();
	},
	changeDirectory(state) {
		try {
			process.chdir(state.cwd);
		} catch (err) {
			return Promise.reject(`Unable to cwd to provided: ${state.cwd}`);
		}

		return Promise.resolve();
	}
};

module.exports = api;
