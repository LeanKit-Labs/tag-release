jest.mock("../src/utils", () => ({
	exec: jest.fn(() => Promise.resolve()),
	log: {
		begin: jest.fn(),
		end: jest.fn()
	}
}));

const util = require("../src/utils");
const git = require("../src/git");
const path = require("path");

describe("git", () => {
	describe("runCommand", () => {
		beforeEach(() => {
			util.advise = jest.fn();
			util.writeFile = jest.fn();
			util.deleteFile = jest.fn();
		});

		it("should run `git` with the given args", () => {
			const branch = "master";
			const includeTags = true;
			const args = `fetch upstream ${branch}${
				includeTags ? " --tags" : ""
			}`;

			return git.runCommand({ args }).then(() => {
				expect(util.exec).toHaveBeenCalledTimes(1);
				expect(util.exec).toHaveBeenCalledWith(
					"git fetch upstream master --tags",
					undefined
				);
			});
		});

		it("should pass maxBuffer when provided", () => {
			const args = "--version";
			return git.runCommand({ args, maxBuffer: 123 }).then(() => {
				expect(util.exec).toHaveBeenCalledTimes(1);
				expect(util.exec).toHaveBeenCalledWith("git --version", 123);
			});
		});

		it("should log output by default", () => {
			return git.runCommand({ args: "--version" }).then(() => {
				expect(util.log.begin).toHaveBeenCalledTimes(1);
				expect(util.log.end).toHaveBeenCalledTimes(1);
			});
		});

		it("should log with the given `logMessage` when provided", () => {
			return git
				.runCommand({
					args: "--version",
					logMessage: "Get git version"
				})
				.then(() => {
					expect(util.log.begin).toHaveBeenCalledTimes(1);
					expect(util.log.begin).toHaveBeenCalledWith(
						"Get git version"
					);
				});
		});

		it("should log with the command with the `logMessage` option is not provided", () => {
			return git.runCommand({ args: "--version" }).then(() => {
				expect(util.log.begin).toHaveBeenCalledTimes(1);
				expect(util.log.begin).toHaveBeenCalledWith("git --version");
			});
		});

		describe("showOutput is false", () => {
			it("should not log output", () => {
				return git
					.runCommand({ args: "--version", showOutput: false })
					.then(() => {
						expect(util.log.begin).not.toHaveBeenCalled();
						expect(util.log.end).not.toHaveBeenCalled();
					});
			});

			describe("maxBuffer is passed", () => {
				it("should not log output when and pass buffer", () => {
					return git
						.runCommand({
							args: "--version",
							showOutput: false,
							maxBuffer: 500
						})
						.then(() => {
							expect(util.log.begin).not.toHaveBeenCalled();
							expect(util.log.end).not.toHaveBeenCalled();
							expect(util.exec).toHaveBeenCalled();
							expect(util.exec).toHaveBeenCalledWith(
								"git --version",
								500
							);
						});
				});
			});
		});

		it("should use full command and not append `git` when the `fullCommand` option is true", () => {
			return git
				.runCommand({ args: "some command", fullCommand: true })
				.then(() => {
					expect(util.exec).toHaveBeenCalledTimes(1);
					expect(util.exec).toHaveBeenCalledWith(
						"some command",
						undefined
					);
				});
		});

		describe("failure", () => {
			beforeEach(() => {
				util.exec = jest.fn(() => Promise.reject("fail"));
			});

			it("should reject when the command execution fails", () => {
				return git.runCommand({ args: "--version" }).catch(err => {
					expect(util.log.end).toHaveBeenCalledTimes(1);
					expect(err).toEqual("fail");
				});
			});

			it("should reject with no error when the command execution fails and `showError` is false", () => {
				return git
					.runCommand({ args: "--version", showError: false })
					.catch(err => {
						expect(util.log.end).toHaveBeenCalledTimes(1);
						expect(err).toEqual(undefined);
					});
			});

			it("should use onError passed as arg when provided", () => {
				const onError = jest.fn(() => Promise.resolve(""));
				return git
					.runCommand({ args: "--version", onError })
					.catch(() => {
						expect(onError).toHaveBeenCalledTimes(1);
					});
			});
		});
	});

	describe("commands", () => {
		const onError = () => {};
		const commands = {
			getRemoteBranches: {
				expectedRunCommandArgs: { args: "branch -r" }
			},
			fetch: {
				expectedRunCommandArgs: { args: "fetch upstream --tags" }
			},
			fetchUpstream: {
				args: "gitFetchUpstream",
				expectedRunCommandArgs: {
					args: "fetch upstream --tags",
					failHelpKey: "gitFetchUpstream"
				}
			},
			checkout: {
				args: "feature-branch",
				expectedRunCommandArgs: { args: "checkout feature-branch" }
			},
			checkoutMaster: {
				expectedRunCommandArgs: { args: "checkout master" }
			},
			checkoutDevelop: {
				expectedRunCommandArgs: {
					args: "checkout develop",
					failHelpKey: "gitCheckoutDevelop"
				}
			},
			merge: {
				args: { branch: "feature-branch", remote: "upstream" },
				expectedRunCommandArgs: {
					args: "merge upstream/feature-branch --ff-only"
				}
			},
			rebase: {
				args: { branch: "upstream/feature-branch", onError },
				expectedRunCommandArgs: {
					args: "rebase upstream/feature-branch --preserve-merges",
					onError,
					exitOnFail: true
				}
			},
			mergeMaster: {
				expectedRunCommandArgs: {
					args: "merge master --ff-only",
					failHelpKey: "gitMergeMaster"
				}
			},
			mergeUpstreamMaster: {
				expectedRunCommandArgs: {
					args: "merge upstream/master --ff-only"
				}
			},
			mergeUpstreamDevelop: {
				expectedRunCommandArgs: {
					args: "merge upstream/develop --ff-only"
				}
			},
			mergePromotionBranch: {
				args: "v1.1.1-feature.0",
				expectedRunCommandArgs: {
					args: "merge promote-release-v1.1.1-feature.0 --no-ff"
				}
			},
			getCurrentBranch: {
				expectedRunCommandArgs: {
					args: "rev-parse --abbrev-ref HEAD",
					log: "Getting current branch"
				}
			},
			getTagList: {
				expectedRunCommandArgs: {
					args: "tag --sort=v:refname",
					logMessage: "Getting list of tags"
				}
			},
			shortLog: {
				expectedRunCommandArgs: {
					args: `--no-pager log --no-merges --date-order --pretty=format:"%s"`,
					logMessage: "Parsing git log"
				}
			},
			diff: {
				args: { files: ["CHANGELOG.md", "package.json"] },
				expectedRunCommandArgs: {
					args: "diff --color CHANGELOG.md package.json"
				}
			},
			add: {
				args: ["CHANGELOG.md", "package.json"],
				expectedRunCommandArgs: {
					args: "add CHANGELOG.md package.json"
				}
			},
			commit: {
				args: "This is a test commit",
				expectedRunCommandArgs: {
					args: `commit -m "This is a test commit"`
				}
			},
			amend: {
				args: "This is a test comment",
				expectedRunCommandArgs: {
					args: `commit --amend -m "This is a test comment"`
				}
			},
			tag: {
				args: "v1.0.0",
				expectedRunCommandArgs: { args: `tag -a v1.0.0 -m v1.0.0` }
			},
			push: {
				args: { branch: "feature-branch", remote: "upstream" },
				expectedRunCommandArgs: {
					args: "push -u upstream feature-branch --tags"
				}
			},
			pushUpstreamMaster: {
				expectedRunCommandArgs: {
					args: "push -u upstream master",
					failHelpKey: "gitPushUpstreamFeatureBranch"
				}
			},
			pushUpstreamMasterWithTags: {
				expectedRunCommandArgs: {
					args: "push -u upstream master --tags"
				}
			},
			pushOriginMaster: {
				expectedRunCommandArgs: { args: "push -u origin master" }
			},
			pushOriginMasterWithTags: {
				expectedRunCommandArgs: { args: "push -u origin master --tags" }
			},
			pushUpstreamDevelop: {
				expectedRunCommandArgs: { args: "push -u upstream develop" }
			},
			uncommittedChangesExist: {
				expectedRunCommandArgs: {
					args: "diff-index HEAD --",
					logMessage: "Checking for uncommitted changes"
				}
			},
			stash: {
				expectedRunCommandArgs: {
					args: "stash",
					logMessage: "Stashing uncommitted changes"
				}
			},
			branchExists: {
				args: "feature-branch",
				expectedRunCommandArgs: {
					args: "branch --list feature-branch",
					logMessage: `Verifying branch: "feature-branch" exists`
				}
			},
			createLocalBranch: {
				args: "feature-branch",
				expectedRunCommandArgs: {
					args: "branch feature-branch upstream/feature-branch",
					logMessage: `Creating local branch "feature-branch"`
				}
			},
			resetBranch: {
				args: "feature-branch",
				expectedRunCommandArgs: {
					args: "reset --hard upstream/feature-branch",
					logMessage: `Hard reset on branch: "feature-branch"`
				}
			},
			checkoutTag: {
				args: "v1.1.1-blah.0",
				expectedRunCommandArgs: {
					args:
						"checkout -b promote-release-v1.1.1-blah.0 v1.1.1-blah.0"
				}
			},
			generateRebaseCommitLog: {
				args: "v1.1.1-blah.0",
				expectedRunCommandArgs: {
					args: `log upstream/master..HEAD --pretty=format:"%h %s"`
				}
			},
			rebaseUpstreamMaster: {
				args: { onError },
				expectedRunCommandArgs: {
					args: "rebase upstream/master --preserve-merges",
					onError,
					exitOnFail: true
				}
			},
			getBranchList: {
				expectedRunCommandArgs: {
					args: "branch",
					logMessage: `Getting branch list`
				}
			},
			deleteBranch: {
				args: "promote-release-v1.1.1-feature.0",
				expectedRunCommandArgs: {
					args: "branch -D promote-release-v1.1.1-feature.0",
					logMessage: "",
					onError: {},
					showOutput: true
				}
			},
			stageFiles: {
				expectedRunCommandArgs: { args: "add -u" }
			},
			rebaseContinue: {
				expectedRunCommandArgs: {
					args: `GIT_EDITOR="cat" git rebase --continue`,
					logMessage: "Continuing with rebase",
					failHelpKey: "gitRebaseInteractive",
					showError: false,
					fullCommand: true
				}
			},
			checkConflictMarkers: {
				expectedRunCommandArgs: {
					args: "diff --check",
					logMessage: "Verifying conflict resolution",
					failHelpKey: "gitCheckConflictMarkers",
					showError: false
				}
			},
			checkoutBranch: {
				args: "feature-branch",
				expectedRunCommandArgs: { args: `checkout feature-branch` }
			},
			rebaseUpstreamBranch: {
				args: { branch: "feature-branch", onError },
				expectedRunCommandArgs: {
					args: `rebase upstream/feature-branch --preserve-merges`,
					onError,
					exitOnFail: true
				}
			},
			rebaseUpstreamDevelop: {
				args: { onError },
				expectedRunCommandArgs: {
					args: `rebase upstream/develop --preserve-merges`,
					failHelpKey: `gitRebaseUpstreamDevelop`,
					exitOnFail: true,
					onError
				}
			},
			getLatestCommitMessage: {
				expectedRunCommandArgs: { args: `log --format=%B -n 1` }
			},
			checkoutAndCreateBranch: {
				args: { branch: "feature-branch" },
				expectedRunCommandArgs: {
					args: `checkout -b feature-branch`,
					onError: {}
				}
			},
			status: {
				expectedRunCommandArgs: { args: `status`, showOutput: true }
			},
			getAllBranchesWithTag: {
				args: "v1.1.1-tag.1",
				expectedRunCommandArgs: {
					args: `branch -a --contains tags/v1.1.1-tag.1`
				}
			},
			deleteBranchUpstream: {
				args: "feature-branch",
				expectedRunCommandArgs: {
					args: `push upstream :feature-branch`,
					showOutput: true,
					logMessage: "",
					onError: {}
				}
			},
			branchExistsRemote: {
				args: { branch: "feature-branch", remote: "upstream" },
				expectedRunCommandArgs: {
					args: `ls-remote upstream feature-branch`,
					logMessage: `Checking if "feature-branch" exists on upstream`
				}
			},
			createRemoteBranch: {
				args: { branch: "feature-branch" },
				expectedRunCommandArgs: {
					args: `push upstream master:feature-branch`
				}
			},
			getLastCommitText: {
				args: true,
				expectedRunCommandArgs: {
					args: `log -1 --pretty=%B`,
					showOutput: true
				}
			},
			pushRemoteBranch: {
				args: { branch: "feature-branch" },
				expectedRunCommandArgs: {
					args: `push -u origin feature-branch`,
					onError: {}
				}
			}
		};

		beforeEach(() => {
			git.runCommand = jest.fn(() => Promise.resolve(""));
		});

		describe("default behavior", () => {
			Object.keys(commands).forEach(command => {
				const testData = commands[command];

				it(`should call "git.${command}" with the appropriate options`, () => {
					const result = testData.args
						? git[command](testData.args)
						: git[command]();

					return result.then(() => {
						expect(git.runCommand).toHaveBeenCalledTimes(1);
						expect(git.runCommand).toHaveBeenCalledWith(
							testData.expectedRunCommandArgs
						);
					});
				});
			});
		});

		describe("alternate behaviors", () => {
			it("should call `git.runCommand` with failHelpKey when provided in the call to `git.checkout`", () => {
				return git.checkout("feature-branch", "test-key").then(() => {
					expect(git.runCommand).toHaveBeenCalledTimes(1);
					expect(git.runCommand).toHaveBeenCalledWith({
						args: "checkout feature-branch",
						failHelpKey: "test-key"
					});
				});
			});

			it("should call `git.shortLog` with the appropriate options when a tag is given", () => {
				return git.shortLog("v1.2.3").then(() => {
					expect(git.runCommand).toHaveBeenCalledTimes(1);
					expect(git.runCommand).toHaveBeenCalledWith({
						args: `--no-pager log --no-merges --date-order --pretty=format:"%s" v1.2.3..`,
						logMessage: "Parsing git log"
					});
				});
			});

			it(`should call "git.merge" without fast-forward when specified`, () => {
				return git
					.merge({
						branch: "feature-branch",
						remote: "upstream",
						fastForwardOnly: false
					})
					.then(() => {
						expect(git.runCommand).toHaveBeenCalledTimes(1);
						expect(git.runCommand).toHaveBeenCalledWith({
							args: "merge upstream/feature-branch --no-ff"
						});
					});
			});

			it(`should call "git.merge" without remote when not specified`, () => {
				return git.merge({ branch: "feature-branch" }).then(() => {
					expect(git.runCommand).toHaveBeenCalledTimes(1);
					expect(git.runCommand).toHaveBeenCalledWith({
						args: "merge feature-branch --ff-only"
					});
				});
			});

			it(`should call "git.push" without tags when specified`, () => {
				return git
					.push({
						branch: "feature-branch",
						remote: "upstream",
						includeTags: false
					})
					.then(() => {
						expect(git.runCommand).toHaveBeenCalledTimes(1);
						expect(git.runCommand).toHaveBeenCalledWith({
							args: "push -u upstream feature-branch"
						});
					});
			});

			it(`should call "git.merge" with provided promotion tag`, () => {
				return git.mergePromotionBranch("v1.1.1").then(() => {
					expect(git.runCommand).toHaveBeenCalledTimes(1);
					expect(git.runCommand).toHaveBeenCalledWith({
						args: "merge promote-release-v1.1.1 --no-ff"
					});
				});
			});

			it(`should call "git.merge" with provided promotion tag`, () => {
				return git.mergePromotionBranch("v1.1.1").then(() => {
					expect(git.runCommand).toHaveBeenCalledTimes(1);
					expect(git.runCommand).toHaveBeenCalledWith({
						args: "merge promote-release-v1.1.1 --no-ff"
					});
				});
			});

			it(`should call "checkoutTag" with provided promotion tag`, () => {
				return git.checkoutTag("v1.1.1").then(() => {
					expect(git.runCommand).toHaveBeenCalledTimes(1);
					expect(git.runCommand).toHaveBeenCalledWith({
						args: "checkout -b promote-release-v1.1.1 v1.1.1"
					});
				});
			});

			it(`should call "deleteBranch" with provided branch`, () => {
				return git
					.deleteBranch("promote-release-v1.1.1", false)
					.then(() => {
						expect(git.runCommand).toHaveBeenCalledTimes(1);
						expect(git.runCommand).toHaveBeenCalledWith({
							args: "branch -D promote-release-v1.1.1",
							logMessage: "",
							onError: {},
							showOutput: false
						});
					});
			});

			it(`should call "createLocalBranch" with provided tracking`, () => {
				return git
					.createLocalBranch("feature-branch", "tracking-branch")
					.then(() => {
						expect(git.runCommand).toHaveBeenCalledTimes(1);
						expect(git.runCommand).toHaveBeenCalledWith({
							args:
								"branch feature-branch upstream/tracking-branch",
							logMessage: `Creating local branch "feature-branch"`
						});
					});
			});

			it(`should call "git.runCommand" with provided failHelpKey when passed to "git.rebase"`, () => {
				return git
					.rebase({
						branch: "feature-branch",
						onError,
						failHelpKey: "test-key"
					})
					.then(() => {
						expect(git.runCommand).toHaveBeenCalledTimes(1);
						expect(git.runCommand).toHaveBeenCalledWith({
							args: "rebase feature-branch --preserve-merges",
							failHelpKey: "test-key",
							onError,
							exitOnFail: true
						});
					});
			});

			it(`should call "rebaseUpstreamDevelop" with default onError of undefined`, () => {
				git.rebase = jest.fn(() => Promise.resolve(""));
				return git.rebaseUpstreamDevelop().then(() => {
					expect(git.rebase).toHaveBeenCalledTimes(1);
					expect(git.rebase).toHaveBeenCalledWith({
						branch: "upstream/develop",
						failHelpKey: "gitRebaseUpstreamDevelop",
						onError: undefined,
						exitOnFail: true
					});
				});
			});

			it(`should call "rebaseUpstreamMaster" with default onError of undefined`, () => {
				git.rebase = jest.fn(() => Promise.resolve(""));
				return git.rebaseUpstreamMaster().then(() => {
					expect(git.rebase).toHaveBeenCalledTimes(1);
					expect(git.rebase).toHaveBeenCalledWith({
						branch: "upstream/master",
						onError: undefined
					});
				});
			});

			describe("createRemoteBranch", () => {
				it("should create branch on upstream with base", () => {
					return git
						.createRemoteBranch({
							branch: "feature-branch",
							remote: "upstream",
							base: "develop"
						})
						.then(() => {
							expect(git.runCommand).toHaveBeenCalledTimes(1);
							expect(git.runCommand).toHaveBeenCalledWith({
								args: "push upstream develop:feature-branch"
							});
						});
				});

				it("should create branch on origin without base", () => {
					return git
						.createRemoteBranch({
							branch: "feature-branch",
							remote: "origin"
						})
						.then(() => {
							expect(git.runCommand).toHaveBeenCalledTimes(1);
							expect(git.runCommand).toHaveBeenCalledWith({
								args: "push origin master:feature-branch"
							});
						});
				});

				it("should create branch on origin with base", () => {
					return git
						.createRemoteBranch({
							branch: "feature-branch",
							remote: "origin",
							base: "feature-branch"
						})
						.then(() => {
							expect(git.runCommand).toHaveBeenCalledTimes(1);
							expect(git.runCommand).toHaveBeenCalledWith({
								args:
									"push origin feature-branch:feature-branch"
							});
						});
				});
			});

			it(`should call "getLastCommitText" with appropriate args`, () => {
				return git.getLastCommitText().then(() => {
					expect(git.runCommand).toHaveBeenCalledTimes(1);
					expect(git.runCommand).toHaveBeenCalledWith({
						args: "log -1 --pretty=%B",
						showOutput: false
					});
				});
			});

			it(`should call "pushRemoteBranch" with appropriate args`, () => {
				return git
					.pushRemoteBranch({
						branch: "feature-branch",
						remote: "upstream",
						onError: {}
					})
					.then(() => {
						expect(git.runCommand).toHaveBeenCalledTimes(1);
						expect(git.runCommand).toHaveBeenCalledWith({
							args: "push -u upstream feature-branch",
							onError: {}
						});
					});
			});

			describe("branchExistsRemote", () => {
				it(`should return if branch exists on "origin" remote`, () => {
					return git
						.branchExistsRemote({
							branch: "feature-branch",
							remote: "origin"
						})
						.then(() => {
							expect(git.runCommand).toHaveBeenCalledTimes(1);
							expect(git.runCommand).toHaveBeenCalledWith({
								args: "ls-remote origin feature-branch",
								logMessage: `Checking if "feature-branch" exists on origin`
							});
						});
				});
			});

			describe("removePreReleaseCommits", () => {
				let joinSpy;
				beforeEach(() => {
					git.runCommand = jest.fn(() => Promise.resolve(""));
					joinSpy = jest
						.spyOn(path, "join")
						.mockImplementation(() => "my_path/");
				});

				it("should call 'git.runCommand' with appropriate arguments", () => {
					return git.removePreReleaseCommits().then(() => {
						expect(git.runCommand).toHaveBeenCalledTimes(1);
						expect(git.runCommand).toHaveBeenCalledWith({
							args:
								'GIT_SEQUENCE_EDITOR="cat my_path/ >" git rebase -i -p upstream/master',
							failHelpKey: "gitRebaseInteractive",
							fullCommand: true,
							logMessage: "Removing pre-release commit history",
							exitOnFail: true
						});
					});
				});

				afterEach(() => {
					joinSpy.mockRestore();
				});
			});

			describe("removePromotionBranches", () => {
				it("should remove all promotion branches", () => {
					git.getBranchList = jest.fn(() =>
						Promise.resolve([
							"feature-branch",
							"promote-release-v1.1.1-feature.0",
							"* master",
							"develop",
							"promote-release-v1.1.1-feature.1"
						])
					);
					git.deleteBranch = jest.fn(branch =>
						Promise.resolve(branch)
					);
					return git.removePromotionBranches().then(result => {
						expect(result).toEqual([
							"promote-release-v1.1.1-feature.0",
							"promote-release-v1.1.1-feature.1"
						]);
						expect(git.deleteBranch).toHaveBeenCalledTimes(2);
					});
				});
			});

			describe("getPrereleaseTagList", () => {
				it("should run `git` with the given args", () => {
					git.runCommand = jest.fn(() =>
						Promise.resolve(`v18.0.0-robert.0
v17.12.0-break.1
v17.12.0-break.0
v17.11.2`)
					);
					return git.getPrereleaseTagList().then(() => {
						expect(git.runCommand).toHaveBeenCalledTimes(1);
						expect(git.runCommand).toHaveBeenCalledWith({
							args: "tag --sort=-v:refname",
							logMessage: "Getting list of pre-releases"
						});
					});
				});

				it("should return list of latest tags", () => {
					git.runCommand = jest.fn(() =>
						Promise.resolve(`v18.0.0-robert.0
v17.12.0-break.0
v17.12.0-break.1
v17.11.2`)
					);
					return git.getPrereleaseTagList(10).then(result => {
						expect(result).toEqual([
							"v18.0.0-robert.0",
							"v17.12.0-break.1"
						]);
					});
				});
			});

			describe("generateRebaseCommitLog", () => {
				let writeSpy;
				beforeEach(() => {
					writeSpy = jest
						.spyOn(util, "writeFile")
						.mockImplementation(() => "");
				});

				it("should remove all pre-release commits", () => {
					git.runCommand = jest.fn(() =>
						Promise.resolve(`0987654 1.1.1-feature.1
et768df this is commit 2
23fe4e3 1.1.1-feature.0
0dda789 this is commit 1`)
					);
					return git.generateRebaseCommitLog().then(() => {
						expect(writeSpy.mock.calls[0][1])
							.toEqual(`pick 0dda789 this is commit 1
pick et768df this is commit 2
`);
					});
				});

				it("should remove all pre-release commits part 2", () => {
					git.runCommand = jest.fn(() =>
						Promise.resolve(`eabc473 1.1.1-feature.1
2f3e4a5 v1.1.1-fancy.9
23ae89c this is commit 2
e7a8e93 1.1.1-feature.0
098abc7 this is commit 1
3eabc56 something random
987abc6 1.0.0-new.0
9b8a76c 0.0.9-new-thing.18
0a9b8c7 another commit
abcd9e8 0.1.1-feature.1 should also be left
e8d9f00 should leave this 0.1.1-feature.0`)
					);
					return git.generateRebaseCommitLog().then(() => {
						expect(writeSpy.mock.calls[0][1])
							.toEqual(`pick e8d9f00 should leave this 0.1.1-feature.0
pick abcd9e8 0.1.1-feature.1 should also be left
pick 0a9b8c7 another commit
pick 3eabc56 something random
pick 098abc7 this is commit 1
pick 23ae89c this is commit 2
`);
					});
				});

				afterEach(() => {
					writeSpy.mockRestore();
				});
			});

			describe("cleanUp", () => {
				let joinSpy, deleteSpy;
				beforeEach(() => {
					joinSpy = jest
						.spyOn(path, "join")
						.mockImplementation(() => "my_path/");
					deleteSpy = jest
						.spyOn(util, "deleteFile")
						.mockImplementation(() => "");
				});

				it("should call 'git.runCommand' with appropriate arguments", () => {
					return git.cleanUp().then(() => {
						expect(deleteSpy).toHaveBeenCalledTimes(1);
						expect(deleteSpy).toHaveBeenCalledWith(`my_path/`);
					});
				});

				afterEach(() => {
					joinSpy.mockRestore();
					deleteSpy.mockRestore();
				});
			});
		});
	});
});
