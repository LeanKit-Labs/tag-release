/* eslint-disable max-lines */
const command = require("../../command");
const git = require("../../git");
const util = require("../../utils");
const semver = require("semver");
const chalk = require("chalk");
const GitHub = require("github-api");
const sequence = require("when/sequence");
const path = require("path");
const removeWords = require("remove-words");
const { get, set, difference, union } = require("lodash");
const { retryRebase } = require("./conflictResolution");
const getCurrentBranch = require("../../helpers/getCurrentBranch");
const getContentsFromYAML = require("../../helpers/getContentsFromYAML");
const getRootDirectory = require("../../helpers/getRootDirectory");

const MAX_PERCENT = 100;
const LOCKED_BRANCHES = ["develop", "master", "main"];

const api = {
	checkoutWorkingBranch(state) {
		state.step = "checkoutWorkingBranch";
		state.branch = state.workingBranch;
		return command.checkoutBranch(state);
	},
	checkoutMaster(state) {
		state.step = "checkoutMaster";
		state.branch = "master";
		return command.checkoutBranch(state);
	},
	checkoutDevelop(state) {
		state.step = "checkoutDevelop";
		state.branch = "develop";
		return command.checkoutBranch(state);
	},
	checkoutTag(state) {
		state.step = "checkoutTag";
		if (state.promote.charAt(0) !== "v") {
			state.promote = `v${state.promote}`;
		}

		return command.checkoutTag({ tag: state.promote });
	},
	checkoutBaseBranch(state) {
		state.step = "checkoutBaseBranch";
		const { hasDevelopBranch } = state;

		if (hasDevelopBranch) {
			return api.checkoutDevelop(state);
		}
		return api.checkoutMaster(state);
	},
	checkoutAndCreateBranch(state) {
		state.step = "checkoutAndCreateBranch";
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
			: () => command.checkoutAndCreateBranch({ branch, onError });

		return result();
	},
	useCurrentOrBaseBranch(state) {
		state.step = "useCurrentOrBaseBranch";
		const { log, hasDevelopBranch } = state;

		let result;
		if (log.length) {
			result = () => Promise.resolve();
		} else if (hasDevelopBranch) {
			result = () => api.checkoutDevelop(state);
		} else {
			result = () => util.advise("qaNoChangeNoDevelop");
		}

		return result();
	},
	fetchUpstream(state) {
		state.step = "fetchUpstream";
		return command.fetchUpstream(state);
	},
	gitMergeUpstreamBranch(state) {
		state.step = "gitMergeUpstreamBranch";
		const { branch, spinner, repo } = state;
		return git.merge({
			branch,
			remote: "upstream",
			failHelpKey: "gitMergeUpstreamBranch",
			spinner,
			repo
		});
	},
	gitMergeUpstreamMaster(state) {
		state.step = "gitMergeUpstreamMaster";
		return command.mergeUpstreamMaster();
	},
	gitMergeUpstreamMasterNoFF(state) {
		state.step = "gitMergeUpstreamMasterNoFF";
		const { spinner, repo } = state;
		return git
			.merge({
				branch: "master",
				remote: "upstream",
				fastForwardOnly: false,
				spinner,
				repo
			})
			.then(result => {
				state.status = result.includes("Already up-to-date.")
					? "up-to-date"
					: "merged";
			});
	},
	gitMergeUpstreamDevelop(state) {
		state.step = "gitMergeUpstreamDevelop";
		return command.mergeUpstreamDevelop();
	},
	gitMergePromotionBranch(state) {
		state.step = "gitMergePromotionBranch";
		return command.mergePromotionBranch(state.promote);
	},
	checkHasDevelopBranch(state) {
		state.step = "checkHasDevelopBranch";
		return command
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
		state.step = "checkExistingPrereleaseIdentifier";
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
		state.step = "setPrereleaseIdentifier";
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
		state.step = "selectPrereleaseToPromote";
		if (state.promote && typeof state.promote === "boolean") {
			return command.getPrereleaseTagList().then(prereleases => {
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
	getCurrentBranchVersion(state) {
		state.step = "getCurrentBranchVersion";
		const { filePaths: { configPath } } = state;
		const { version } = util.readJSONFile(configPath);

		state.currentVersion = version;
		return Promise.resolve();
	},
	gitShortLog(state) {
		state.step = "gitShortLog";
		const {
			currentVersion,
			prerelease,
			spinner,
			repo,
			filePaths: { changeLogPath }
		} = state;

		let contents = util.readFile(changeLogPath);

		if (contents && contents.includes("### Next")) {
			contents = contents.replace(
				/### Next([^#]+)/,
				(match, submatch) => {
					state.log = submatch.trim();
					return "";
				}
			);

			util.writeFile(changeLogPath, contents);
		} else {
			return command.getTagList(spinner, repo).then(tags => {
				let latestRelease = "";
				if (tags.length) {
					latestRelease = `v${currentVersion}`;
					if (!prerelease) {
						tags = tags.filter(tag => !tag.includes("-"));
						latestRelease = tags[tags.length - 1];
					}
				}

				return command
					.shortLog(latestRelease, spinner, repo)
					.then(data => {
						data = data.trim().replace(/^(.+)$/gm, "* $1");
						if (!data.length) {
							util.advise("gitLog.log");
						}

						state.log = data;
					});
			});
		}
	},
	previewLog(state) {
		state.step = "previewLog";
		const { log } = state;
		util.logger.log(`${chalk.bold("Here is a preview of your log:")}
${chalk.green(log)}`);
	},
	async askSemverJump(state) {
		state.step = "askSemverJump";
		let { currentVersion } = state;
		const { prerelease, release } = state;

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

		// If there are no tagged releases in repository, assumes this is the
		// initial release. So, you can create 0.0.1, 0.1.0, 1.0.0 versions.
		currentVersion = await command.getTagList().then(tags => {
			tags = tags.filter(tag => !!tag && !tag.includes("-"));
			return tags && tags.length === 0 ? "0.0.0" : currentVersion;
		});

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
				state.currentVersion = currentVersion;
				return Promise.resolve();
			});
	},
	updateLog(state) {
		state.step = "updateLog";
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
		state.step = "updateVersion";
		const {
			filePaths: { rootPath, configPath },
			currentVersion,
			prerelease,
			release
		} = state;
		const pkg = util.readJSONFile(configPath);

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
				`Updated ${configPath.replace(
					`${rootPath}/`,
					""
				)} from ${oldVersion} to ${newVersion}`
			)
		);
	},
	updateChangelog(state) {
		state.step = "updateChangelog";
		const {
			log,
			release,
			versions: { newVersion },
			filePaths: { changeLogPath }
		} = state;
		const version = `### ${newVersion}`;
		const update = `${version}\n\n${log}`;
		const wildcardVersion = newVersion.replace(/\.\d+\.\d+/, ".x");

		util.log.begin("update changelog");
		let contents = util.readFile(changeLogPath);
		contents = contents ? contents : "";

		if (release === "major") {
			contents = `## ${wildcardVersion}\n\n${update}\n\n${contents}`;
		} else {
			contents = contents
				? contents.replace(/(## .*\n)/, `$1\n${update}\n`)
				: `## ${wildcardVersion}\n\n${update}\n`;
		}

		util.writeFile(changeLogPath, contents);
		util.log.end();
	},
	gitDiff(state) {
		state.step = "gitDiff";
		const {
			filePaths: { configPath, changeLogPath, packageLockJsonPath }
		} = state;
		const files = [configPath];

		if (util.fileExists(changeLogPath)) {
			files.push(changeLogPath);
		}

		if (util.fileExists(packageLockJsonPath)) {
			files.push(packageLockJsonPath);
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
		state.step = "gitAdd";
		const {
			filePaths: {
				rootPath,
				configPath,
				changeLogPath,
				gitIgnorePath,
				packageLockJsonPath
			}
		} = state;
		const files = [changeLogPath, configPath];

		let found;
		if (util.fileExists(packageLockJsonPath)) {
			if (util.fileExists(gitIgnorePath)) {
				found = !!util
					.readFile(gitIgnorePath)
					.split("\n")
					.find(line =>
						line.includes(
							packageLockJsonPath.replace(`${rootPath}/`, "")
						)
					);
			}
			if (!found) {
				files.push(packageLockJsonPath);
			}
		}

		return git.add({ files });
	},
	gitStageConfigFile(state) {
		state.step = "gitStageConfigFile";
		const { filePaths: { configPath }, spinner, repo } = state;

		return git.add({ files: [configPath], spinner, repo });
	},
	gitCommit(state) {
		state.step = "gitCommit";
		const { versions: { newVersion }, spinner, repo } = state;

		return git.commit({ comment: newVersion, spinner, repo });
	},
	gitTag(state) {
		state.step = "gitTag";
		const { versions: { newVersion }, spinner, repo } = state;
		const tag = `v${newVersion}`;

		return git.tag({ tag, spinner, repo }).then(() => {
			state.tag = tag;
		});
	},
	gitPushUpstreamMaster(state) {
		state.step = "gitPushUpstreamMaster";
		const { tag } = state;
		return command.pushUpstreamMasterWithTag({ tag });
	},
	npmPublish(state) {
		state.step = "npmPublish";
		const { filePaths: { configPath }, prerelease } = state;
		if (!configPath.includes("package.json")) {
			return null;
		}

		let publishCommand = "npm publish";
		publishCommand = prerelease
			? `${publishCommand} --tag ${prerelease}`
			: publishCommand;

		if (!util.isPackagePrivate(configPath)) {
			util.log.begin(publishCommand);
			return util
				.exec(publishCommand)
				.then(() => util.log.end())
				.catch(() => util.advise("npmPublish", { exit: false }));
		}
	},
	gitMergeDevelopWithMaster(state) {
		state.step = "gitMergeDevelopWithMaster";
		return command.mergeMaster();
	},
	gitPushUpstreamDevelop(state) {
		state.step = "gitPushUpstreamDevelop";
		return command.pushUpstreamDevelop();
	},
	gitPushUpstreamFeatureBranch(state) {
		state.step = "gitPushUpstreamFeatureBranch";
		const { branch, tag, spinner, repo } = state;
		if (branch && branch.length) {
			return git.push({
				branch,
				remote: "upstream",
				option: "-u",
				tag,
				spinner,
				repo
			});
		}
	},
	gitForcePushUpstreamFeatureBranch(state) {
		state.step = "gitForcePushUpstreamFeatureBranch";
		const { branch } = state;
		if (branch && branch.length) {
			return git.push({
				branch,
				remote: "upstream",
				option: "-f"
			});
		}
	},
	gitPushOriginMaster(state) {
		state.step = "gitPushOriginMaster";
		return command.pushOriginMaster();
	},
	githubUpstream(state) {
		state.step = "githubUpstream";
		const { spinner, repo } = state;
		const remote = "upstream";
		return git
			.config({ remote, spinner, repo })
			.then(response => {
				set(state, `remotes.${remote}.url`, response.trim());
				const [, owner, name] =
					response.match(
						/github\.com[:/](.*)\/(.*(?=\.git)|(?:.*))/
					) || [];

				state.github = Object.assign({}, state.github, {
					upstream: { owner, name }
				});
			})
			.catch(error => util.logger.log("error", error));
	},
	githubOrigin(state) {
		state.step = "githubOrigin";
		const remote = "origin";
		return git
			.config({ remote })
			.then(response => {
				set(state, `remotes.${remote}.url`, response.trim());
				const [, owner, name] =
					response.match(
						/github\.com[:/](.*)\/(.*(?=\.git)|(?:.*))/
					) || [];
				state.github = Object.assign({}, state.github, {
					origin: { owner, name }
				});
			})
			.catch(error => util.logger.log("error", error));
	},
	githubRelease(state) {
		state.step = "githubRelease";
		const {
			github: {
				upstream: { owner: repositoryOwner, name: repositoryName }
			},
			log,
			prerelease,
			token,
			versions: { newVersion },
			releaseName
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

		const method =
			process.env.NO_OUTPUT || releaseName
				? () =>
						Promise.resolve({
							name: releaseName ? releaseName : defaultName
						})
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
	async gitStash(state) {
		state.step = "gitStash";
		const current = await getCurrentBranch();
		return command.uncommittedChangesExist(state).then(results => {
			if (results.length) {
				state.stashed = current;
				return git.stash({ option: "--include-untracked" });
			}
		});
	},
	resetIfStashed(state) {
		state.step = "resetIfStashed";
		const { stashed, spinner, repo } = state;
		const onError = () => {
			util.advise("gitStashPop", { exit: false });
			return () => Promise.resolve();
		};

		if (stashed) {
			return command
				.checkoutBranch({ branch: stashed, spinner, repo })
				.then(() => {
					return git.stash({
						option: "pop",
						logMessage: "git stash pop",
						onError
					});
				});
		}
	},
	verifyMasterBranch(state) {
		state.step = "verifyMasterBranch";
		return command.branchExists("master").then(exists => {
			if (!exists) {
				return command.createLocalBranch("master");
			}
		});
	},
	verifyDevelopBranch(state) {
		state.step = "verifyDevelopBranch";
		return command.branchExists("develop").then(exists => {
			if (!exists && state.hasDevelopBranch) {
				return command.createLocalBranch("develop");
			}
		});
	},
	gitResetMaster(state) {
		state.step = "gitResetMaster";
		return command.resetBranch("master");
	},
	gitResetDevelop(state) {
		state.step = "gitResetDevelop";
		if (state.hasDevelopBranch) {
			return command.resetBranch("develop");
		}
		return Promise.resolve();
	},
	gitGenerateRebaseCommitLog(state) {
		state.step = "gitGenerateRebaseCommitLog";
		return command.generateRebaseCommitLog();
	},
	gitRemovePreReleaseCommits(state) {
		state.step = "gitRemovePreReleaseCommits";

		const onError = err => {
			return () => retryRebase(err);
		};

		return command.removePreReleaseCommits({ onError });
	},
	checkIfReOrderNeeded(state) {
		state.step = "checkIfReOrderNeeded";
		state.reOrder = true;

		const bumpedRegEx = /Bumped (.*): (.*)/;
		return command.getLatestCommitMessage().then(msg => {
			if (bumpedRegEx.test(msg)) {
				state.reOrder = false;
			}
		});
	},
	reOrderLatestCommits(state) {
		state.step = "reOrderLatestComits";

		if (!state.reOrder) {
			return Promise.resolve();
		}

		return command.reOrderLatestCommits().then(result => {
			state.reOrder = result;
		});
	},
	reOrderBumpCommit(state) {
		state.step = "reOrderBumpCommit";

		if (!state.reOrder) {
			return Promise.resolve();
		}

		const onError = () => {
			util.advise("reOrderFail");
			return Promise.reject();
		};

		return command.reOrderBumpCommit({ onError });
	},
	gitRebaseUpstreamMaster(state) {
		state.step = "gitRebaseUpstreamMaster";
		return command.rebaseUpstreamMaster();
	},
	gitRemovePromotionBranches(state) {
		state.step = "gitRemovePromotionBranches";
		return command.removePromotionBranches();
	},
	gitStageFiles(state) {
		state.step = "gitStageFiles";
		return command.stageFiles();
	},
	gitRebaseContinue(state) {
		state.step = "gitRebaseContinue";

		const onError = err => {
			return () => retryRebase(err);
		};

		return command.rebaseContinue({ onError }).then(() => state);
	},
	setPromote(state) {
		state.step = "setPromote";
		state.promote = state.branch.slice(
			state.branch.indexOf("v"),
			state.branch.length
		); // retrieve from promote-release branch, e.g. v1.1.1-feature.0
		return Promise.resolve();
	},
	getPackageScope(state) {
		state.step = "getPackageScope";
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
		state.step = "getScopedRepos";
		const { filePaths: { configPath }, scope } = state;
		const content = util.readJSONFile(configPath);

		const getScopedDependencies = (dependencies = {}, packageScope) =>
			Object.keys(dependencies).filter(key => key.includes(packageScope));

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
	},
	askReposToUpdate(state) {
		state.step = "askReposToUpdate";
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
		state.step = "askVersion";
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
		state.step = "askVersions";
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
		state.step = "askChangeType";
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
		// TODO: Does this need to go into it's own helper file?
		return changeReason.trim().length > 0;
	},
	askChangeReason(state) {
		state.step = "askChangeReason";
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
	updateDependencies(state) {
		state.step = "updateDependencies";
		const { dependencies, filePaths: { configPath }, scope } = state;
		const content = util.readJSONFile(configPath);

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

		return Promise.resolve();
	},
	gitCommitBumpMessage(state) {
		state.step = "gitCommitBumpMessage";
		const { dependencies, changeReason } = state;
		const arr = [];
		dependencies.forEach(item => {
			arr.push(`${item.pkg} to ${item.version}`);
		});

		state.bumpComment = `Bumped ${arr.join(", ")}: ${changeReason}`;

		return git.commit({ comment: state.bumpComment });
	},
	verifyPackagesToPromote(state) {
		state.step = "verifyPackagesToPromote";
		const { packages } = state;
		if (packages && packages.length === 0) {
			util.advise("noPackages");
		}

		return Promise.resolve();
	},
	gitRebaseUpstreamBranch(state) {
		state.step = "gitRebaseUpstreamBranch";
		const { branch } = state;
		return command.rebaseUpstreamBranch({ branch });
	},
	gitRebaseUpstreamDevelop(state) {
		state.step = "gitRebaseUpstreamDevelop";
		return command.rebaseUpstreamDevelop();
	},
	getReposFromBumpCommit(state) {
		state.step = "getReposFromBumpCommit";
		return command.getLatestCommitMessage().then(msg => {
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

			return Promise.resolve(state);
		});
	},
	gitAmendCommitBumpMessage(state) {
		state.step = "gitAmendCommitBumpMessage";
		const { dependencies, changeReason } = state;
		const arr = [];
		dependencies.forEach(item => {
			arr.push(`${item.pkg} to ${item.version}`);
		});

		state.bumpComment = `Bumped ${arr.join(", ")}: ${changeReason}`;

		return command.commitAmend({ comment: state.bumpComment });
	},
	getCurrentDependencyVersions(state) {
		state.step = "getCurrentDependencyVersions";
		const { packages, filePaths: { configPath }, scope } = state;
		state.dependencies = [];

		const content = util.readJSONFile(configPath);

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

		return Promise.resolve();
	},
	createGithubPullRequestAganistBase(state) {
		state.step = "createGithubPullRequestAganistBase";
		const {
			github: {
				upstream: { owner: repositoryOwner, name: repositoryName }
			},
			token,
			branch,
			bump,
			hasDevelopBranch
		} = state;
		const github = new GitHub({ token });
		util.log.begin("creating pull request to github");

		const repository = github.getRepo(repositoryOwner, repositoryName);

		let options = {};
		if (bump) {
			const [, , reason = ""] =
				state.bumpComment.match(/Bumped (.*): (.*)/) || [];
			options = {
				title: reason,
				head: `${repositoryOwner}:${branch}`,
				base: hasDevelopBranch ? "develop" : "master"
			};
		} else {
			options = {
				title: "Updating localization strings",
				head: `${repositoryOwner}:${branch}`,
				base: hasDevelopBranch ? "develop" : "master"
			};
		}

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
		state.step = "createGithubPullRequestAganistBranch";
		const {
			github: {
				upstream: {
					owner: repositoryUpstreamOwner,
					name: repositoryUpstreamName
				},
				origin: { owner: repositoryOriginOwner }
			},
			lkId,
			token,
			branch,
			devBranch,
			pullRequest: { title, body }
		} = state;
		const github = new GitHub({ token });
		util.log.begin("creating pull request to github");

		const repository = github.getRepo(
			repositoryUpstreamOwner,
			repositoryUpstreamName
		);

		const options = {
			title: `${title}${lkId ? ` (LK:${lkId})` : ""}`,
			body,
			head: `${repositoryOriginOwner}:${branch}`,
			base: devBranch ? `${devBranch}` : `${branch}`
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
		state.step = "saveState";
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
	cleanUpTmpFiles(state) {
		state.step = "cleanUpTmpFiles";
		util.deleteFile(path.join(__dirname, ".state.json"));
		util.deleteFile(path.join(__dirname, ".dependencies.json"));

		return command.cleanUp();
	},
	promptBranchName(state) {
		state.step = "promptBranchName";
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
	getTagsFromRepo(state, repositoryName) {
		state.step = "getTagsFromRepo";
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
		state.step = "verifyRemotes";
		return git.remote().then(response => {
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
		state.step = "verifyOrigin";
		const { remotes: { origin } } = state;
		util.log.begin("Verifying origin remote");

		if (!origin.exists) {
			util.advise("gitOrigin");
		}

		util.log.end();
		return Promise.resolve();
	},
	verifyUpstream(state) {
		state.step = "verifyUpstream";
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
					return util
						.exec(`git remote add upstream ${parentSshUrl}`)
						.then(util.log.end())
						.catch(err => util.logger.log(chalk.red(err)));
				})
				.catch(err => util.logger.log(chalk.red(err)));
		}

		util.log.end();
		return Promise.resolve();
	},
	verifyChangelog(state) {
		state.step = "verifyChangelog";
		const { filePaths: { changeLogPath } } = state;
		util.log.begin("Verifying CHANGELOG.md");
		if (util.fileExists(changeLogPath)) {
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
					return util.writeFile(changeLogPath, "");
				}

				return Promise.resolve();
			});
	},
	verifyPackageJson(state) {
		state.step = "verifyPackageJson";
		const { filePaths: { rootPath, configPath } } = state;
		util.log.begin(`Verifying ${configPath.replace(`${rootPath}/`, "")}`);
		util.log.end();

		if (!util.fileExists(configPath)) {
			util.advise("missingPackageJson");
		}

		return Promise.resolve();
	},
	isPackagePrivate(state) {
		state.step = "isPackagePrivate";
		const { filePaths: { configPath } } = state;
		if (util.isPackagePrivate(configPath)) {
			util.advise("privatePackage");
		}

		return Promise.resolve();
	},
	checkNewCommits(state) {
		state.step = "checkNewCommits";
		return command.getTagList().then(tags => {
			tags = tags.filter(tag => !tag.includes("-"));
			if (tags && tags.length === 0) {
				return Promise.resolve();
			}

			const latestRelease = tags[tags.length - 1];
			return command.shortLog(latestRelease).then(data => {
				state.log = data;
			});
		});
	},
	promptKeepBranchOrCreateNew(state) {
		state.step = "promptKeepBranchOrCreateNew";
		const { log, branch } = state;

		if (!log.length || LOCKED_BRANCHES.includes(branch)) {
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
				return command
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
		state.step = "findBranchByTag";
		const { promote: tag } = state;
		return command.getAllBranchesWithTag(tag).then(response => {
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
		state.step = "deleteLocalFeatureBranch";
		const { branchToRemove: branch } = state;

		const onError = () => {
			return () => Promise.resolve();
		};

		return command.deleteBranch({
			branch,
			logMessage: "Cleaning local feature branch",
			onError
		});
	},
	deleteUpstreamFeatureBranch(state) {
		state.step = "deleteUpstreamFeatureBranch";
		const { branchToRemove: branch } = state;

		const onError = () => {
			return () => Promise.resolve();
		};

		return command.deleteBranchUpstream({
			branch,
			logMessage: "Cleaning upstream feature branch",
			onError
		});
	},
	saveDependencies(state) {
		state.step = "saveDependencies";
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
		state.step = "getDependenciesFromFile";
		const content = util.readJSONFile(
			path.join(__dirname, ".dependencies.json")
		);

		if (content) {
			Object.assign(state, content);
		}

		return Promise.resolve();
	},
	updatePackageLockJson(state) {
		state.step = "updatePackageLockJson";
		const {
			dependencies,
			currentVersion,
			scope,
			filePaths: { packageLockJsonPath }
		} = state;

		if (util.fileExists(packageLockJsonPath)) {
			if (currentVersion) {
				let pkg = {};
				pkg = util.readJSONFile(packageLockJsonPath);
				pkg.version = currentVersion;
				util.writeJSONFile(packageLockJsonPath, pkg);
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
		// TODO: should this be a helper?
		const installCommand = `npm install ${dependency} -E`;

		return () => {
			util.log.begin(installCommand);
			return util
				.exec(installCommand)
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
		state.step = "gitCreateBranchUpstream";
		let { branch } = state;
		const { hasDevelopBranch, devBranch } = state;
		branch = devBranch ? devBranch : branch;
		const remote = "upstream";

		return command.branchExistsRemote({ branch, remote }).then(exists => {
			if (!exists) {
				const base = hasDevelopBranch ? "develop" : "master";
				return command.createRemoteBranch({ branch, remote, base });
			}
		});
	},
	gitCreateBranchOrigin(state) {
		state.step = "gitCreateBranchOrigin";
		const { branch } = state;
		const remote = "origin";

		const onError = () => {
			util.advise("remoteBranchOutOfDate", { exit: false });
			return () => Promise.resolve();
		};

		return command.branchExistsRemote({ branch, remote }).then(exists => {
			if (!exists) {
				return command.createRemoteBranch({
					branch,
					remote: "origin",
					base: branch
				});
			}
			return command.pushRemoteBranch({ branch, remote, onError });
		});
	},
	updatePullRequestTitle(state) {
		state.step = "updatePullRequestTitle";
		return command.getLastCommitText().then(commitText => {
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
	addLKId(state) {
		state.step = "addLKId";
		return util
			.prompt([
				{
					type: "confirm",
					name: "hasId",
					message: "Do you have a LK ID?",
					default: false
				}
			])
			.then(answers => {
				if (answers.hasId) {
					return util
						.prompt([
							{
								type: "input",
								name: "id",
								message: "What is your LK ID?"
							}
						])
						.then(response => {
							state.lkId = response.id.trim();
							return Promise.resolve();
						});
				}
				return Promise.resolve();
			});
	},
	updatePullRequestBody(state) {
		state.step = "updatePullRequestBody";
		const { filePaths: { pullRequestTemplatePath } } = state;
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
				const contents = util.fileExists(pullRequestTemplatePath)
					? util.readFile(pullRequestTemplatePath)
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
	rebaseUpstreamBaseBranch(state) {
		state.step = "rebaseUpstreamBaseBranch";
		const { hasDevelopBranch } = state;

		if (hasDevelopBranch) {
			return command.rebaseUpstreamDevelop();
		}

		return command.rebaseUpstreamMaster();
	},
	changeDirectory(state) {
		state.step = "changeDirectory";
		try {
			process.chdir(state.cwd);
		} catch (err) {
			return Promise.reject(`Unable to cwd to provided: ${state.cwd}`);
		}

		return Promise.resolve();
	},
	createOrCheckoutBranch(state) {
		state.step = "createOrCheckoutBranch";
		const { branch, spinner, repo } = state;

		return command.branchExists(branch, spinner, repo).then(exists => {
			if (!exists) {
				return command
					.branchExistsRemote({
						branch,
						remote: "upstream",
						spinner,
						repo
					})
					.then(existsRemote => {
						if (existsRemote) {
							return git.checkout({
								branch,
								option: "-b",
								tracking: branch,
								spinner,
								repo
							});
						}
						// TODO: Should we advise here if we can't find branch locally
						// or on the upstream?
						return command.checkoutBranch({
							branch,
							spinner,
							repo
						});
					});
			}
			return command.checkoutBranch({ branch, spinner, repo });
		});
	},
	diffWithUpstreamMaster(state) {
		state.step = "diffWithUpstreamMaster";
		const { maxbuffer, spinner, repo } = state;

		return git
			.diff({
				option: "--word-diff",
				branch: "master",
				glob: "*.yaml",
				maxBuffer: maxbuffer,
				spinner,
				repo
			})
			.then(diff => {
				if (diff) {
					const regex = /((?:\[-.+-\])|(?:\{\+.+\+\})).*[^\r]/g;
					const items = diff.match(regex) || [];
					const { ins, del } = items.reduce(
						(memo, item) => {
							if (item.match(/\+}\[-/g) || item.match(/-\]{+/g)) {
								return memo;
							} else if (item.match(/{+/g)) {
								memo.ins++;
							} else {
								memo.del++;
							}
							return memo;
						},
						{ ins: 0, del: 0 }
					);
					state.changes = {
						locale: !!ins,
						dev: !!del
					};
				}
			});
	},
	checkoutl10nBranch(state) {
		state.step = "checkoutl10nBranch";
		const today = new Date();
		const currentMonth = today
			.toLocaleString("en-us", { month: "short" })
			.toLowerCase();
		const branch = `feature-localization-${currentMonth}-${today.getDate()}`;

		return command.branchExists(branch).then(exists => {
			state.branch = branch;
			if (!exists) {
				return command.checkoutAndCreateBranch({ branch });
			}
			state.status = "skipped";
			return command.checkoutBranch({ branch }).then(() => {
				return Promise.resolve();
			});
		});
	},
	commitDiffWithUpstreamMaster(state) {
		state.step = "commitDiffWithUpstreamMaster";
		const { branch, spinner, repo } = state;
		return git
			.log({
				option: "--no-merges --oneline",
				branch,
				remote: "upstream/master",
				spinner,
				repo
			})
			.then(commits => {
				if (commits) {
					state.changes.diff = commits.trim().split("\n").length;
				}
			});
	},
	buildLocale(state) {
		state.step = "buildLocale";
		const { filePaths: { configPath } } = state;
		const { scripts } = util.readJSONFile(configPath);

		const buildLocaleCommand = "npm run build:locale";
		if (scripts.hasOwnProperty("build:locale")) {
			util.log.begin(buildLocaleCommand);
			return util
				.exec(buildLocaleCommand)
				.then(() => util.log.end())
				.catch(() => util.advise("buildLocale", { exit: false }));
		}
		return Promise.resolve();
	},
	getLangCodes(state) {
		state.step = "getLangCodes";
		const { cwd } = state;

		// Find path to translation files
		let localePath;
		if (util.fileExists(`${cwd}/locale/en-US.yaml`)) {
			localePath = `${cwd}/locale`;
		} else if (util.fileExists(`${cwd}/client/js/locale/en-US.yaml`)) {
			localePath = `${cwd}/client/js/locale`;
		} else {
			return Promise.resolve();
		}

		let files = util.readDirFileNames(localePath);
		files = files.filter(
			file =>
				!file.includes("spec") &&
				!file.includes("all") &&
				!file.includes("en-US") &&
				file.includes("yaml")
		);
		const langRegex = /^(.*-?[A-Z]?).yaml/;
		const codes = files.map(file => {
			const [, code] = langRegex.exec(file);
			return code;
		});

		state.langCodes = union(state.langCodes, codes);
		state.localePath = localePath;
		return Promise.resolve();
	},
	getl10nCoverage(state) {
		state.step = "getl10nCoverage";
		const { repo, langCodes, localePath, l10nKeyOverrides } = state;

		if (!localePath) {
			state.coverage = { keyCount: 0 };
			return Promise.resolve();
		}

		const enUSContents = getContentsFromYAML(localePath, "en-US");
		const enUSKeys = Object.keys(enUSContents);
		const coverage = {};
		langCodes.forEach(code => {
			const contents = getContentsFromYAML(localePath, code);
			const docKeys = Object.keys(contents);
			const diff = difference(enUSKeys, docKeys);
			let same;
			if (get(l10nKeyOverrides, `${repo}.${code}`)) {
				same = enUSKeys.filter(
					k =>
						!diff.includes(k) &&
						!l10nKeyOverrides[repo][code].includes(k) &&
						contents[k] === enUSContents[k]
				);
			} else {
				same = enUSKeys.filter(
					k => !diff.includes(k) && contents[k] === enUSContents[k]
				);
			}

			coverage[code] = {
				percent: (
					MAX_PERCENT -
					(diff.length + same.length) / enUSKeys.length * MAX_PERCENT
				).toFixed(1),
				diff,
				same
			};
		});

		coverage.keyCount = enUSKeys.length;
		state.coverage = coverage;
		return Promise.resolve();
	},
	runPreScript(state) {
		state.step = "runPreScript";
		const { command: cmd, scripts } = state;
		const script = scripts[`pre${cmd}`];
		util.log.begin(`running pre script: ${script}`);
		return util.exec(script).then(stdout => {
			util.log.end();
			if (stdout) {
				util.log.begin(stdout.trim());
				util.log.end();
			}
		});
	},
	runPostScript(state) {
		state.step = "runPostScript";
		const { command: cmd, scripts } = state;
		const script = scripts[`post${cmd}`];
		util.log.begin(`running post script: ${script}`);
		return util.exec(script).then(stdout => {
			util.log.end();
			if (stdout) {
				util.log.begin(stdout.trim());
				util.log.end();
			}
		});
	},
	async setFilePaths(state) {
		state.step = "setFilePaths";
		const rootDir = await getRootDirectory();
		state.filePaths = {
			rootPath: rootDir,
			configPath: `${rootDir}/package.json`,
			changeLogPath: `${rootDir}/CHANGELOG.md`,
			packageLockJsonPath: `${rootDir}/package-lock.json`,
			gitIgnorePath: `${rootDir}/.gitignore`,
			pullRequestTemplatePath: `${rootDir}/.github/PULL_REQUEST_TEMPLATE.md`
		};

		return Promise.resolve();
	}
};

module.exports = api;
