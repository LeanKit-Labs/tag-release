/* eslint max-lines: off, max-statements: off */

jest.mock("editor", () => {
	return jest.fn((arg, cb) => cb(0));
});

jest.mock("chalk", () => ({
	bold: jest.fn(arg => arg),
	red: jest.fn(arg => arg),
	gray: jest.fn(arg => arg),
	green: jest.fn(arg => arg),
	yellow: jest.fn(arg => arg),
	underline: jest.fn(arg => arg)
}));

jest.mock("github-api", () => {
	return jest.fn();
});

jest.mock("remove-words", () => {
	return jest.fn(arg => arg.split(" "));
});

jest.mock("when/sequence", () => {
	return jest.fn(() =>
		Promise.resolve([
			{
				pkg: "over-watch",
				version: "2.0.0-new.0"
			},
			{
				pkg: "watch-over",
				version: "3.0.0-new.1"
			}
		])
	);
});

import chalk from "chalk"; // eslint-disable-line no-unused-vars
import editor from "editor"; // eslint-disable-line no-unused-vars
import semver from "semver";
import GitHub from "github-api";
import * as run from "../../../src/workflows/steps/index";
import sequence from "when/sequence";
import path from "path";
const util = require("../../../src/utils");
const git = require("../../../src/git");
const command = require("../../../src/command");
const conflictResolution = require("../../../src/workflows/steps/conflictResolution");

jest.mock("../../../src/git");
jest.mock("../../../src/command");
jest.mock("../../../src/utils");

jest.mock("../../../src/helpers/getCurrentBranch", () =>
	jest.fn(() => Promise.resolve("current-branch"))
);

jest.mock("../../../src/helpers/filterFlowBasedOnDevelopBranch", flow =>
	jest.fn(() => flow)
);

jest.mock("../../../src/workflows/steps/conflictResolution", () => ({
	retryRebase: jest.fn(() => Promise.resolve())
}));

describe("shared workflow steps", () => {
	let state;

	beforeEach(() => {
		util.log.begin = jest.fn();
		util.log.end = jest.fn();
		command.runCommand = jest.fn(() =>
			Promise.resolve("command.runCommand")
		);
		state = {
			step: ""
		};
	});

	describe("checkoutWorkingBranch", () => {
		it(`should checkout "workingBranch"`, () => {
			state.workingBranch = "working-branch";
			state.branch = "feature-branch";
			run.checkoutWorkingBranch(state);
			expect(state.branch).toBe("working-branch");
			expect(command.checkoutBranch).toHaveBeenCalledTimes(1);
		});
	});

	describe("fetchUpstream", () => {
		it("should return the result of `command.fetchUpstream`", () => {
			run.fetchUpstream(state);
			expect(command.fetchUpstream).toHaveBeenCalledTimes(1);
		});
	});

	describe("gitMergeUpstreamBranch", () => {
		it(`should call "git.merge" with the appropriate args`, () => {
			state.branch = "feature-branch";

			run.gitMergeUpstreamBranch(state);
			expect(git.merge).toHaveBeenCalledTimes(1);
			expect(git.merge).toHaveBeenCalledWith({
				branch: "feature-branch",
				remote: "upstream",
				failHelpKey: "gitMergeUpstreamBranch"
			});
		});
	});

	describe("gitMergeUpstreamMaster", () => {
		it(`should call "command.mergeUpstreamMaster"`, () => {
			run.gitMergeUpstreamMaster(state);
			expect(command.mergeUpstreamMaster).toHaveBeenCalledTimes(1);
		});
	});

	describe("gitMergeUpstreamMasterNoFF", () => {
		beforeEach(() => {
			git.merge = jest.fn(() => Promise.resolve(""));
		});

		it("should call git.merge with appropriate args", async () => {
			await run.gitMergeUpstreamMasterNoFF(state);
			expect(git.merge).toHaveBeenCalledTimes(1);
			expect(git.merge).toHaveBeenCalledWith({
				branch: "master",
				remote: "upstream",
				fastForwardOnly: false
			});
		});

		it("should set step on state", async () => {
			await run.gitMergeUpstreamMasterNoFF(state);
			expect(state).toHaveProperty("step");
			expect(state.step).toEqual("gitMergeUpstreamMasterNoFF");
		});

		describe("status", () => {
			it("should set up-to-date status", async () => {
				git.merge = jest.fn(() =>
					Promise.resolve("Already up-to-date.")
				);
				await run.gitMergeUpstreamMasterNoFF(state);
				expect(state).toHaveProperty("status");
				expect(state.status).toEqual("up-to-date");
			});

			it("should set merged status", async () => {
				git.merge = jest.fn(() => Promise.resolve(""));
				await run.gitMergeUpstreamMasterNoFF(state);
				expect(state).toHaveProperty("status");
				expect(state.status).toEqual("merged");
			});
		});
	});

	describe("gitMergeUpstreamDevelop", () => {
		it(`should call "command.mergeUpstreamDevelop"`, () => {
			run.gitMergeUpstreamDevelop(state);
			expect(command.mergeUpstreamDevelop).toHaveBeenCalledTimes(1);
		});
	});

	describe("gitMergePromotionBranch", () => {
		it(`should call "command.mergePromotionBranch" with appropriate args`, () => {
			state.promote = "v1.1.1";

			run.gitMergePromotionBranch(state);
			expect(command.mergePromotionBranch).toHaveBeenCalledTimes(1);
			expect(command.mergePromotionBranch).toHaveBeenCalledWith("v1.1.1");
		});
	});

	describe("checkHasDevelopBranch", () => {
		it("should set `hasDevelopBranch` to true on state when an `upstream/develop` branch exists", () => {
			const branches =
				"branch-one\nbranch-two\nbranch-three\nupstream/branch-one\nupstream/branch-two\nupstream/branch-three\nupstream/develop";
			command.getRemoteBranches = jest.fn(() =>
				Promise.resolve(branches)
			);

			return run.checkHasDevelopBranch(state).then(() => {
				expect(command.getRemoteBranches).toHaveBeenCalledTimes(1);
				expect(state).toHaveProperty("hasDevelopBranch");
				expect(state.hasDevelopBranch).toBeTruthy();
			});
		});

		it("should set `hasDevelopBranch` to false on state when no `upstream/develop` branch exists", () => {
			const branches =
				"branch-one\nbranch-two\nbranch-three\nupstream/branch-one\nupstream/branch-two\nupstream/branch-three";
			command.getRemoteBranches = jest.fn(() =>
				Promise.resolve(branches)
			);

			return run.checkHasDevelopBranch(state).then(() => {
				expect(command.getRemoteBranches).toHaveBeenCalledTimes(1);
				expect(state).toHaveProperty("hasDevelopBranch");
				expect(state.hasDevelopBranch).toBeFalsy();
			});
		});

		it("should set `hasDevelopBranch` to false on state when the command throws an error", () => {
			command.getRemoteBranches = jest.fn(() => Promise.reject());

			return run.checkHasDevelopBranch(state).then(() => {
				expect(command.getRemoteBranches).toHaveBeenCalledTimes(1);
				expect(state).toHaveProperty("hasDevelopBranch");
				expect(state.hasDevelopBranch).toBeFalsy();
			});
		});
	});

	describe("checkExistingPrereleaseIdentifier", () => {
		beforeEach(() => {
			state = {
				currentVersion: "1.0.0-some-other-identifier.0"
			};
		});

		it("should not modify state with existing identifier", () => {
			state.prerelease = "some-identifier";
			return run.checkExistingPrereleaseIdentifier(state).then(() => {
				expect(state).toHaveProperty("prerelease");
				expect(state.prerelease).toEqual("some-identifier");
				expect(state).not.toHaveProperty("release");
			});
		});

		it("should set state with identifier and release type", () => {
			return run.checkExistingPrereleaseIdentifier(state).then(() => {
				expect(state).toHaveProperty("prerelease");
				expect(state.prerelease).toEqual("some-other-identifier");
				expect(state).toHaveProperty("release");
				expect(state.release).toEqual("prerelease");
			});
		});

		it("should do nothing with no existing identifier", () => {
			state.currentVersion = "1.0.0";
			return run.checkExistingPrereleaseIdentifier(state).then(() => {
				expect(state).not.toHaveProperty("prerelease");
				expect(state).not.toHaveProperty("release");
			});
		});
	});

	describe("setPrereleaseIdentifier", () => {
		beforeEach(() => {
			util.prompt = jest.fn(() =>
				Promise.resolve({ prereleaseIdentifier: "pre" })
			);
		});

		it("should not prompt if an identifier was provided at the command line", () => {
			state = { prerelease: "test" };
			return run.setPrereleaseIdentifier(state).then(() => {
				expect(util.prompt).not.toHaveBeenCalled();
			});
		});

		it("should prompt the user for a prerelease identifier", () => {
			return run.setPrereleaseIdentifier(state).then(() => {
				expect(util.prompt).toHaveBeenCalledTimes(1);
				expect(util.prompt).toHaveBeenCalledWith([
					{
						type: "input",
						name: "prereleaseIdentifier",
						message: "What is your pre-release Identifier?"
					}
				]);
			});
		});

		it("should persist the given identifier to the workflow state", () => {
			return run.setPrereleaseIdentifier(state).then(() => {
				expect(state).toHaveProperty("prerelease");
				expect(state.prerelease).toEqual("pre");
			});
		});

		["defect", "feature", "rework"].forEach(redundantIdentifierPrefix => {
			it(`should strip "${redundantIdentifierPrefix}-" from the beginning of the identifier when it is present`, () => {
				state = {
					prerelease: `${redundantIdentifierPrefix}-test-prerelease-identifier`
				};
				return run.setPrereleaseIdentifier(state).then(() => {
					expect(state.prerelease).toEqual(
						"test-prerelease-identifier"
					);
				});
			});
		});
	});

	describe("selectPrereleaseToPromote", () => {
		beforeEach(() => {
			util.prompt = jest.fn(() =>
				Promise.resolve({ prereleaseIdentifier: "pre" })
			);
			command.getPrereleaseTagList = jest.fn(() =>
				Promise.resolve([
					"v18.0.0-robert.0",
					"v17.12.0-break.1",
					"v17.11.2-no-break.0",
					"v17.11.0-no-conflict.1",
					"v17.10.6-conflict.4"
				])
			);
		});

		it("should not prompt if tag was provided at the command line", () => {
			state = { promote: "v1.1.1-feature.0" };
			return run.selectPrereleaseToPromote(state).then(() => {
				expect(util.prompt).not.toHaveBeenCalled();
			});
		});

		it("should prompt with the latest tags for promotion", () => {
			state = { promote: true };
			return run.selectPrereleaseToPromote(state).then(() => {
				expect(util.prompt).toHaveBeenCalledTimes(1);
				expect(util.prompt).toHaveBeenCalledWith([
					{
						type: "list",
						name: "prereleaseToPromote",
						message: "Which pre-release do you wish to promote?",
						choices: [
							"v18.0.0-robert.0",
							"v17.12.0-break.1",
							"v17.11.2-no-break.0",
							"v17.11.0-no-conflict.1",
							"v17.10.6-conflict.4"
						]
					}
				]);
			});
		});

		describe("should persist the selected promote option to state", () => {
			const prereleases = [
				"v18.0.0-robert.0",
				"v17.12.0-break.1",
				"v17.11.2-no-break.0",
				"v17.11.0-no-conflict.1",
				"v17.10.6-conflict.4"
			];

			prereleases.forEach(prereleaseToPromote => {
				it(`when "${prereleaseToPromote}" is selected`, () => {
					state = { promote: true };
					command.getPrereleaseTagList = jest.fn(() =>
						Promise.resolve(prereleases)
					);
					util.prompt = jest.fn(() =>
						Promise.resolve({ prereleaseToPromote })
					);
					return run.selectPrereleaseToPromote(state).then(() => {
						expect(state).toHaveProperty("promote");
						expect(state.promote).toEqual(prereleaseToPromote);
					});
				});
			});
		});
	});

	describe("checkoutMaster", () => {
		it(`should set "branch" on state to "master"`, () => {
			run.checkoutMaster(state);
			expect(state).toHaveProperty("branch");
			expect(state.branch).toEqual("master");
		});

		it(`should call "command.checkoutBranch"`, () => {
			run.checkoutMaster(state);
			expect(command.checkoutBranch).toHaveBeenCalledTimes(1);
		});
	});

	describe("getCurrentBranchVersion", () => {
		beforeEach(() => {
			state.configPath = "./package.json";
			util.readJSONFile = jest.fn(() => ({ version: "1.2.3" }));
		});

		it("should call `util.readJSONFile`", () => {
			return run.getCurrentBranchVersion(state).then(() => {
				expect(util.readJSONFile).toHaveBeenCalledTimes(1);
				expect(util.readJSONFile).toHaveBeenCalledWith(
					"./package.json"
				);
			});
		});

		it("should write the current version from the config file to state", () => {
			return run.getCurrentBranchVersion(state).then(() => {
				expect(state).toHaveProperty("currentVersion");
				expect(state.currentVersion).toEqual("1.2.3");
			});
		});
	});

	describe("gitShortLog", () => {
		beforeEach(() => {
			state.currentVersion = "1.2.3";
			util.writeFile = jest.fn(() => {});
		});

		it("should read the contents of the CHANGELOG.md file", () => {
			command.shortLog = jest.fn(() => Promise.resolve(""));
			command.getTagList = jest.fn(() => Promise.resolve([]));
			util.readFile = jest.fn(() => "sample content");
			run.gitShortLog({});
			expect(util.readFile).toHaveBeenCalledTimes(1);
			expect(util.readFile).toHaveBeenCalledWith("CHANGELOG.md");
		});

		describe("when a line containing `### Next` exists in the CHANGELOG.md contents", () => {
			beforeEach(() => {
				util.readFile = jest.fn(
					() => "### Next\n\n* one\n* two\n* three"
				);
			});

			it("should strip it out and write the remaining contents of it to state", () => {
				run.gitShortLog(state);
				expect(state).toHaveProperty("log");
				expect(state.log).toEqual("* one\n* two\n* three");
			});

			it("should empty the contents of the CHANGELOG.md file", () => {
				util.writeFile = jest.fn(() => {});

				run.gitShortLog(state);
				expect(util.writeFile).toHaveBeenCalledTimes(1);
				expect(util.writeFile).toHaveBeenCalledWith("CHANGELOG.md", "");
			});
		});

		describe("when no line containing `### Next` exists in the CHANGELOG.md contents", () => {
			beforeEach(() => {
				util.readFile = jest.fn(() => "* four\n* five\n* six\n* seven");
				util.advise = jest.fn(() => {});
				command.shortLog = jest.fn(() =>
					Promise.resolve("eight\nnine\nten")
				);
				command.getTagList = jest.fn(() =>
					Promise.resolve([
						"v0.1.0",
						"v0.2.0",
						"v0.3.0",
						"v0.4.0",
						"v0.5.0",
						"v0.6.0",
						"v0.7.0",
						"v0.8.0",
						"v0.9.0",
						"v0.9.1",
						"v0.9.1-pre-1",
						"v0.9.1-pre-2",
						"v0.9.1-pre-3",
						"v0.9.1-pre-4"
					])
				);
			});

			describe("and not in prerelease mode", () => {
				beforeEach(() => {
					state = {
						currentVersion: "1.2.3",
						prerelease: false
					};
				});

				it("should get a list of tags", () => {
					return run.gitShortLog(state).then(() => {
						expect(command.getTagList).toHaveBeenCalledTimes(1);
					});
				});

				it("should get a git log with the latest release from the list of tags returned", () => {
					return run.gitShortLog(state).then(() => {
						expect(command.shortLog).toHaveBeenCalledTimes(1);
						expect(command.shortLog).toHaveBeenCalledWith(
							"v0.9.1",
							undefined,
							undefined
						);
					});
				});

				it("should get all logs when there are no tags", () => {
					command.getTagList = jest.fn(() => Promise.resolve([]));

					return run.gitShortLog(state).then(() => {
						expect(command.shortLog).toHaveBeenCalledTimes(1);
						expect(command.shortLog).toHaveBeenCalledWith(
							"v1.2.3",
							undefined,
							undefined
						);
					});
				});

				it("should advise when the attempt to get all logs returns no data", () => {
					command.shortLog = jest.fn(() => Promise.resolve(""));

					return run.gitShortLog(state).then(() => {
						expect(util.advise).toHaveBeenCalledTimes(1);
						expect(util.advise).toHaveBeenCalledWith("gitLog.log");
					});
				});

				it("should save log data to state", () => {
					return run.gitShortLog(state).then(() => {
						expect(state).toHaveProperty("log");
						expect(state.log).toEqual("* eight\n* nine\n* ten");
					});
				});
			});

			describe("and in prerelease mode", () => {
				beforeEach(() => {
					state = {
						currentVersion: "1.2.3",
						prerelease: true
					};
				});

				it("should use the current version when fetching log data", () => {
					return run.gitShortLog(state).then(() => {
						expect(command.shortLog).toHaveBeenCalledTimes(1);
						expect(command.shortLog).toHaveBeenCalledWith(
							"v1.2.3",
							undefined,
							undefined
						);
					});
				});
			});
		});
	});

	describe("previewLog", () => {
		beforeEach(() => {
			state.log = "* I am some random commit";
		});

		it("should show logs when provided", () => {
			run.previewLog(state);
			expect(util.logger.log).toHaveBeenCalledTimes(1);
			expect(util.logger.log).toHaveBeenCalledWith(
				"Here is a preview of your log:\n* I am some random commit"
			);
		});

		it("should show a blank line when no logs are provided", () => {
			state.log = "";
			run.previewLog(state);
			expect(util.logger.log).toHaveBeenCalledTimes(1);
			expect(util.logger.log).toHaveBeenCalledWith(
				"Here is a preview of your log:\n"
			);
		});
	});

	describe("askSemverJump", () => {
		beforeEach(() => {
			state.currentVersion = "1.2.3";
			util.prompt = jest.fn(() => Promise.resolve({ release: "test" }));
			util.advise = jest.fn(() => {});
		});

		describe("when the prerelease option is false", () => {
			it("should prompt the user with choices for Major, Minor and Patch releases", () => {
				return run.askSemverJump(state).then(() => {
					expect(util.prompt).toHaveBeenCalledTimes(1);
					expect(util.prompt).toHaveBeenCalledWith([
						{
							type: "list",
							name: "release",
							message: "What type of release is this?",
							choices: [
								{
									name: "Major (Breaking Change) v2.0.0",
									value: "major",
									short: "l"
								},
								{
									name: "Minor (New Feature) v1.3.0",
									value: "minor",
									short: "m"
								},
								{
									name: "Patch (Bug Fix) v1.2.4",
									value: "patch",
									short: "s"
								}
							]
						}
					]);
				});
			});
		});

		describe("when the prerelease option is true", () => {
			it("should prompt the user with choices for Pre-major, Pre-minor, Pre-patch and Pre-release releases", () => {
				state = {
					currentVersion: "1.2.3",
					prerelease: "test"
				};

				return run.askSemverJump(state).then(() => {
					expect(util.prompt).toHaveBeenCalledTimes(1);
					expect(util.prompt).toHaveBeenCalledWith([
						{
							type: "list",
							name: "release",
							message: "What type of release is this?",
							choices: [
								{
									name:
										"Pre-major (Breaking Change) v2.0.0-test.0",
									value: "premajor",
									short: "p-l"
								},
								{
									name:
										"Pre-minor (New Feature) v1.3.0-test.0",
									value: "preminor",
									short: "p-m"
								},
								{
									name: "Pre-patch (Bug Fix) v1.2.4-test.0",
									value: "prepatch",
									short: "p-s"
								},
								{
									name:
										"Pre-release (Bump existing Pre-release) v1.2.4-test.0",
									value: "prerelease",
									short: "p-r"
								}
							]
						}
					]);
				});
			});
		});

		describe("when the release option has been provided", () => {
			it("should not prompt the user to select a release option", () => {
				state = {
					currentVersion: "1.2.3",
					release: "prepatch"
				};

				return run.askSemverJump(state).then(() => {
					expect(util.prompt).not.toHaveBeenCalled();
				});
			});
		});

		describe("should persist the selected release option to state", () => {
			const releaseTypes = [
				"major",
				"minor",
				"patch",
				"premajor",
				"preminor",
				"prepatch",
				"prerelease"
			];

			releaseTypes.forEach(release => {
				it(`when "${release}"" is selected`, () => {
					util.prompt = jest.fn(() => Promise.resolve({ release }));
					return run.askSemverJump(state).then(() => {
						expect(state).toHaveProperty("release");
						expect(state.release).toEqual(release);
					});
				});
			});
		});
	});

	describe("updateLog", () => {
		beforeEach(() => {
			state.log = "the originally persisted log message";
			util.editFile = jest.fn(() =>
				Promise.resolve(" an updated commit message ")
			);
			util.prompt = jest.fn(() => Promise.resolve({ log: false }));
		});

		it("should prompt asking the user if they wish to edit the log", () => {
			return run.updateLog(state).then(() => {
				expect(util.prompt).toHaveBeenCalledTimes(1);
				expect(util.prompt).toHaveBeenCalledWith([
					{
						type: "confirm",
						name: "log",
						message: "Would you like to edit your log?",
						default: true
					}
				]);
			});
		});

		describe("when the user chooses to edit the log", () => {
			beforeEach(() => {
				util.prompt = jest.fn(() => Promise.resolve({ log: true }));
			});

			it("should launch the user's editor", () => {
				return run.updateLog(state).then(() => {
					expect(util.editFile).toHaveBeenCalledTimes(1);
					expect(util.editFile).toHaveBeenCalledWith(
						"the originally persisted log message"
					);
				});
			});

			it("should trim the data from the editor, and persist the result to state", () => {
				return run.updateLog(state).then(() => {
					expect(state).toHaveProperty("log");
					expect(state.log).toEqual("an updated commit message");
				});
			});

			it("should log the action to the console", () => {
				return run.updateLog(state).then(() => {
					expect(util.log.begin).toHaveBeenCalledTimes(1);
					expect(util.log.begin).toHaveBeenCalledWith("log preview");
					expect(util.log.end).toHaveBeenCalledTimes(1);
				});
			});
		});

		describe("when the user declines to edit the log", () => {
			it("should not launch the user's editor", () => {
				util.prompt = jest.fn(() => Promise.resolve({ log: false }));
				return run.updateLog(state).then(() => {
					expect(util.editFile).not.toHaveBeenCalled();
				});
			});
		});
	});

	describe("updateVersion", () => {
		beforeEach(() => {
			state = {
				configPath: "./package.json",
				currentVersion: "1.2.3",
				prerelease: undefined,
				release: "minor"
			};
			util.readJSONFile = jest.fn(() => ({ version: "1.2.3" }));
		});

		it("should read from the given configuration file", () => {
			run.updateVersion(state);
			expect(util.readJSONFile).toHaveBeenCalledTimes(1);
			expect(util.readJSONFile).toHaveBeenCalledWith("./package.json");
		});

		it("should call `semver.inc` with the selected release", () => {
			const originalInc = semver.inc;
			semver.inc = jest.fn(() => "1.3.0");
			run.updateVersion(state);
			expect(semver.inc).toHaveBeenCalledTimes(1);
			expect(semver.inc).toHaveBeenCalledWith(
				"1.2.3",
				"minor",
				undefined
			);
			semver.inc = originalInc;
		});

		it("should write the updated version to the given configuration file", () => {
			util.writeJSONFile = jest.fn(() => {});
			run.updateVersion(state);
			expect(util.writeJSONFile).toHaveBeenCalledTimes(1);
			expect(util.writeJSONFile).toHaveBeenCalledWith("./package.json", {
				version: "1.3.0"
			});
		});

		it("should use alternate configuration file when provided", () => {
			state = {
				configPath: "./manifest.json",
				currentVersion: "1.2.3",
				prerelease: undefined,
				release: "minor"
			};

			run.updateVersion(state);
			expect(util.readJSONFile).toHaveBeenCalledTimes(1);
			expect(util.readJSONFile).toHaveBeenCalledWith("./manifest.json");
		});

		it("should update alternate configuration file when provided", () => {
			state = {
				configPath: "./manifest.json",
				currentVersion: "1.2.3",
				prerelease: undefined,
				release: "minor"
			};

			util.writeJSOnFile = jest.fn(() => {});

			run.updateVersion(state);
			expect(util.writeJSONFile).toHaveBeenCalledTimes(1);
			expect(util.writeJSONFile).toHaveBeenCalledWith("./manifest.json", {
				version: "1.3.0"
			});
		});
	});

	describe("updateChangelog", () => {
		const originalConsoleLog = console.log; // eslint-disable-line no-console

		beforeEach(() => {
			state = {
				versions: {
					newVersion: "1.3.0"
				},
				log: "* commit message",
				release: "minor"
			};

			util.readFile = jest.fn(
				() => "## 1.x\n\n### 1.2.3\n\n* update to v1.2.3"
			);
			util.writeFile = jest.fn(() => {});
			console.log = jest.fn(() => {}); // eslint-disable-line no-console
		});

		afterEach(() => {
			console.log = originalConsoleLog; // eslint-disable-line no-console
		});

		it("should log the action to the console", () => {
			run.updateChangelog(state);
			expect(util.log.begin).toHaveBeenCalledTimes(1);
			expect(util.log.end).toHaveBeenCalledTimes(1);
		});

		it("should read the current contents of CHANGELOG.md", () => {
			run.updateChangelog(state);
			expect(util.readFile).toHaveBeenCalledTimes(1);
			expect(util.readFile).toHaveBeenCalledWith("CHANGELOG.md");
		});

		it("should insert an H3 header for minor and patch changes", () => {
			run.updateChangelog(state);
			const contents =
				"## 1.x\n\n### 1.3.0\n\n* commit message\n\n### 1.2.3\n\n* update to v1.2.3";
			expect(util.writeFile).toHaveBeenCalledTimes(1);
			expect(util.writeFile).toHaveBeenCalledWith(
				"CHANGELOG.md",
				contents
			);
		});

		it("should insert an H2 header for major changes", () => {
			state.release = "major";
			state.versions.newVersion = "2.0.0";
			run.updateChangelog(state);
			const contents =
				"## 2.x\n\n### 2.0.0\n\n* commit message\n\n## 1.x\n\n### 1.2.3\n\n* update to v1.2.3";
			expect(util.writeFile).toHaveBeenCalledTimes(1);
			expect(util.writeFile).toHaveBeenCalledWith(
				"CHANGELOG.md",
				contents
			);
		});

		it("should create a new entry in CHANGELOG.md for minor/defect changes", () => {
			util.readFile = jest.fn(() => "");
			state = {
				release: "minor",
				log: "* just little stuff",
				versions: {
					newVersion: "2.0.1"
				}
			};

			run.updateChangelog(state);
			const contents = "## 2.x\n\n### 2.0.1\n\n* just little stuff\n";
			expect(util.writeFile).toHaveBeenCalledTimes(1);
			expect(util.writeFile).toHaveBeenCalledWith(
				"CHANGELOG.md",
				contents
			);
		});
	});

	describe("gitDiff", () => {
		const originalProcessExit = process.exit;

		beforeEach(() => {
			state.configPath = "./package.json";
			process.exit = jest.fn(() => {});
			util.fileExists = jest.fn(() => true);
			git.diff = jest.fn(() => Promise.resolve(""));
			util.prompt = jest.fn(() => Promise.resolve({ proceed: true }));
		});

		afterEach(() => {
			process.exit = originalProcessExit;
		});

		it("should log the action to the console", () => {
			return run.gitDiff(state).then(() => {
				expect(util.log.begin).toHaveBeenCalledTimes(1);
				expect(util.log.end).toHaveBeenCalledTimes(1);
			});
		});

		describe("when package-lock.json exists", () => {
			it(`should call "git.diff" with the appropriate arguments`, () => {
				return run.gitDiff(state).then(() => {
					expect(git.diff).toHaveBeenCalledTimes(1);
					expect(git.diff).toHaveBeenCalledWith({
						files: [
							"CHANGELOG.md",
							"./package.json",
							"package-lock.json"
						],
						maxBuffer: undefined,
						onError: expect.any(Function)
					});
				});
			});
		});

		describe("when package-lock.json doesn't exists", () => {
			it(`should call "git.diff" with the appropriate arguments`, () => {
				util.fileExists = jest.fn(() => false);
				return run.gitDiff(state).then(() => {
					expect(git.diff).toHaveBeenCalledTimes(1);
					expect(git.diff).toHaveBeenCalledWith({
						files: ["CHANGELOG.md", "./package.json"],
						maxBuffer: undefined,
						onError: expect.any(Function)
					});
				});
			});
		});

		it("should prompt the user and ask if the diff is acceptable", () => {
			return run.gitDiff(state).then(() => {
				expect(util.prompt).toHaveBeenCalledTimes(1);
				expect(util.prompt).toHaveBeenCalledWith([
					{
						type: "confirm",
						name: "proceed",
						message: "Are you OK with this diff?",
						default: true
					}
				]);
			});
		});

		it("should exit the program if the user isn't OK with the diff", () => {
			util.prompt = jest.fn(() => Promise.resolve({ proceed: false }));

			return run.gitDiff(state).then(() => {
				expect(process.exit).toHaveBeenCalledTimes(1);
				expect(process.exit).toHaveBeenCalledWith(0);
			});
		});

		describe("when handling error", () => {
			beforeEach(() => {
				git.diff = jest.fn((...args) => {
					return args[0].onError({
						message: `maxBuffer exceeded`
					})();
				});

				util.advise = jest.fn(() => Promise.resolve());
			});

			it("should handle if maxBuffer exceeded", () => {
				return run.gitDiff(state).catch(() => {
					expect(git.diff).toHaveBeenCalledTimes(1);
					expect(util.advise).toHaveBeenCalledTimes(1);
					expect(util.advise).toHaveBeenCalledWith(
						"maxBufferExceeded"
					);
				});
			});

			it("should handle generic error", () => {
				git.diff = jest.fn((...args) => {
					return args[0].onError({ message: "some generic error" })();
				});
				return run.gitDiff(state).catch(() => {
					expect(git.diff).toHaveBeenCalledTimes(1);
					expect(util.advise).toHaveBeenCalledTimes(1);
					expect(util.advise).toHaveBeenCalledWith(
						"gitCommandFailed"
					);
				});
			});
		});
	});

	describe("gitAdd", () => {
		beforeEach(() => {
			state.configPath = "./manifest.json";
			git.add = jest.fn(() => Promise.resolve());
			util.fileExists
				.mockReturnValueOnce(true)
				.mockReturnValueOnce(false);
		});

		it(`should call "git.add" with the appropriate arguments`, () => {
			return run.gitAdd(state).then(() => {
				expect(git.add).toHaveBeenCalledTimes(1);
				expect(git.add).toHaveBeenCalledWith({
					files: [
						"CHANGELOG.md",
						"./manifest.json",
						"package-lock.json"
					]
				});
			});
		});

		describe("when package-lock.json doesn't exist", () => {
			it(`should call "git.add" with the appropriate arguments`, () => {
				util.fileExists = jest.fn(() => false);
				return run.gitAdd(state).then(() => {
					expect(git.add).toHaveBeenCalledTimes(1);
					expect(git.add).toHaveBeenCalledWith({
						files: ["CHANGELOG.md", "./manifest.json"]
					});
				});
			});
		});

		describe(".gitignore", () => {
			describe("exists", () => {
				beforeEach(() => {
					util.fileExists = jest.fn(() => true);
				});

				describe("contains package-lock.json path", () => {
					it(`should call "git.add" with the appropriate arguments`, () => {
						util.readFile = jest.fn(() => "package-lock.json");
						return run.gitAdd(state).then(() => {
							expect(git.add).toHaveBeenCalledTimes(1);
							expect(git.add).toHaveBeenCalledWith({
								files: ["CHANGELOG.md", "./manifest.json"]
							});
						});
					});
				});

				describe("doesn't contain package-lock.json path", () => {
					it(`should call "git.add" with the appropriate arguments`, () => {
						util.readFile = jest.fn(() => "another-lock.json");
						return run.gitAdd(state).then(() => {
							expect(git.add).toHaveBeenCalledTimes(1);
							expect(git.add).toHaveBeenCalledWith({
								files: [
									"CHANGELOG.md",
									"./manifest.json",
									"package-lock.json"
								]
							});
						});
					});
				});
			});
		});
	});

	describe("gitStageConfigFile", () => {
		beforeEach(() => {
			state.configPath = "./package.json";
			git.add = jest.fn(() => Promise.resolve());
		});

		it(`should call "git.add" with the appropriate arguments`, () => {
			return run.gitStageConfigFile(state).then(() => {
				expect(git.add).toHaveBeenCalledTimes(1);
				expect(git.add).toHaveBeenCalledWith({
					files: ["./package.json"]
				});
			});
		});
	});

	describe("gitCommit", () => {
		it(`should call "git.commit" with the appropriate arguments`, () => {
			state = { versions: { newVersion: "1.2.3" } };
			git.commit = jest.fn(() => Promise.resolve());
			return run.gitCommit(state).then(() => {
				expect(git.commit).toHaveBeenCalledTimes(1);
				expect(git.commit).toHaveBeenCalledWith({
					comment: "1.2.3"
				});
			});
		});
	});

	describe("gitTag", () => {
		it(`should call "git.tag" with the appropriate options`, () => {
			state = { versions: { newVersion: "1.2.3" } };
			git.tag = jest.fn(() => Promise.resolve());
			return run.gitTag(state).then(() => {
				expect(git.tag).toHaveBeenCalledTimes(1);
				expect(git.tag).toHaveBeenCalledWith({
					tag: "v1.2.3"
				});
			});
		});
	});

	describe("gitPushUpstreamMaster", () => {
		it("should call `command.pushUpstreamMasterWithTag`", () => {
			run.gitPushUpstreamMaster(state);
			expect(command.pushUpstreamMasterWithTag).toHaveBeenCalledTimes(1);
		});
	});

	describe("npmPublish", () => {
		beforeEach(() => {
			state = { configPath: "./package.json" };
			util.prompt = jest.fn(() => Promise.resolve({ publish: true }));
			util.exec = jest.fn(() => Promise.resolve("data"));
			util.isPackagePrivate = jest.fn(() => false);
			util.readJSONFile = jest.fn(() => ({
				name: "test-project",
				publishConfig: {
					registry: "http://example-registry.com"
				}
			}));
			util.getPackageRegistry = jest.fn(() =>
				Promise.resolve("http://example-registry.com")
			);
		});

		it("should log the action to the console", () => {
			return run.npmPublish(state).then(() => {
				expect(util.log.begin).toHaveBeenCalledTimes(1);
				expect(util.log.end).toHaveBeenCalledTimes(1);
			});
		});

		it("should publish with identifier for pre-releases", () => {
			state = {
				configPath: "./package.json",
				prerelease: "my-identifier"
			};
			util.prompt = jest.fn(() => Promise.resolve({ publish: true }));
			return run.npmPublish(state).then(() => {
				expect(util.log.begin).toHaveBeenCalledWith(
					"npm publish --tag my-identifier"
				);
				expect(util.exec).toHaveBeenCalledWith(
					"npm publish --tag my-identifier"
				);
			});
		});

		it("should publish for releases", () => {
			state = { configPath: "./package.json", prerelease: false };
			util.prompt = jest.fn(() => Promise.resolve({ publish: true }));
			return run.npmPublish(state).then(() => {
				expect(util.log.begin).toHaveBeenCalledWith("npm publish");
				expect(util.exec).toHaveBeenCalledWith("npm publish");
			});
		});

		it("should not prompt if the package is private", () => {
			util.isPackagePrivate = jest.fn(() => true);
			util.getPackageRegistry = jest.fn(() => Promise.resolve());
			run.npmPublish(state);
			expect(util.getPackageRegistry).not.toHaveBeenCalled();
		});

		it("should advise when the call to `util.exec` fails", () => {
			util.exec = jest.fn(() => Promise.reject());
			util.advise = jest.fn(() => {});
			return run.npmPublish(state).then(() => {
				expect(util.advise).toHaveBeenCalledTimes(1);
				expect(util.advise).toHaveBeenCalledWith("npmPublish", {
					exit: false
				});
			});
		});

		it("should do nothing when the given configuration file is not `package.json`", () => {
			state = { configPath: "./manifest.json" };
			util.isPackagePrivate = jest.fn(() => Promise.resolve());
			run.npmPublish(state);
			expect(util.isPackagePrivate).not.toHaveBeenCalled();
		});
	});

	describe("checkoutDevelop", () => {
		it(`should call "command.checkoutBranch"`, () => {
			run.checkoutDevelop(state);
			expect(command.checkoutBranch).toHaveBeenCalledTimes(1);
		});
	});

	describe("gitMergeDevelopWithMaster", () => {
		it(`should call "command.mergeMaster"`, () => {
			run.gitMergeDevelopWithMaster(state);
			expect(command.mergeMaster).toHaveBeenCalledTimes(1);
		});
	});

	describe("gitPushUpstreamDevelop", () => {
		it(`should call "command.pushUpstreamDevelop" when there is a develop branch`, () => {
			run.gitPushUpstreamDevelop(state);
			expect(command.pushUpstreamDevelop).toHaveBeenCalledTimes(1);
		});
	});

	describe("gitPushUpstreamFeatureBranch", () => {
		it(`should call "git.push" with the appropriate options`, () => {
			state = { branch: "feature-branch", tag: "v1.0.0" };
			run.gitPushUpstreamFeatureBranch(state);
			expect(git.push).toHaveBeenCalledTimes(1);
			expect(git.push).toHaveBeenCalledWith({
				branch: state.branch,
				remote: "upstream",
				option: "-u",
				tag: state.tag
			});
		});

		it(`should not call "git.push" when the current branch is not set on the workflow state`, () => {
			run.gitPushUpstreamFeatureBranch(state);
			expect(git.push).not.toHaveBeenCalled();
		});
	});

	describe("gitForcePushUpstreamFeatureBranch", () => {
		it(`should call "git.push" with the appropriate options`, () => {
			state = { branch: "feature-branch" };
			run.gitForcePushUpstreamFeatureBranch(state);
			expect(git.push).toHaveBeenCalledTimes(1);
			expect(git.push).toHaveBeenCalledWith({
				branch: state.branch,
				remote: "upstream",
				option: "-f"
			});
		});

		it(`should not call "git.push" when the current branch is not set on the workflow state`, () => {
			run.gitForcePushUpstreamFeatureBranch(state);
			expect(git.push).not.toHaveBeenCalled();
		});
	});

	describe("gitPushOriginMaster", () => {
		it(`should call "command.pushOriginMaster"`, () => {
			run.gitPushOriginMaster(state);
			expect(command.pushOriginMaster).toHaveBeenCalledTimes(1);
		});
	});

	describe("githubUpstream", () => {
		beforeEach(() => {
			git.config = jest.fn(() =>
				Promise.resolve("git@github.com:JohnDoe/test_repo.git")
			);
		});

		it(`should call "git.config" with the appropriate args`, () => {
			return run.githubUpstream(state).then(() => {
				expect(git.config).toHaveBeenCalledTimes(1);
				expect(git.config).toHaveBeenCalledWith({ remote: "upstream" });
			});
		});

		describe("when an https uri is returned", () => {
			beforeEach(() => {
				git.config = jest.fn(() =>
					Promise.resolve("https://github.com/JohnDoe/test_repo.git")
				);
			});

			it("should extract repository owner and name", () => {
				return run.githubUpstream(state).then(() => {
					expect(state).toEqual({
						github: {
							upstream: {
								owner: "JohnDoe",
								name: "test_repo"
							}
						},
						remotes: {
							upstream: {
								url: "https://github.com/JohnDoe/test_repo.git"
							}
						},
						step: "githubUpstream"
					});
				});
			});
		});

		describe("when an ssh uri is returned", () => {
			it("should extract repository owner and name", () => {
				return run.githubUpstream(state).then(() => {
					expect(state).toEqual({
						github: {
							upstream: {
								owner: "JohnDoe",
								name: "test_repo"
							}
						},
						remotes: {
							upstream: {
								url: "git@github.com:JohnDoe/test_repo.git"
							}
						},
						step: "githubUpstream"
					});
				});
			});
		});

		describe("when no data is returned", () => {
			beforeEach(() => {
				git.config = jest.fn(() => Promise.resolve(""));
			});

			it("should set the github object on state to an empty object", () => {
				return run.githubUpstream(state).then(() => {
					expect(state).toEqual({
						github: {
							upstream: {
								name: undefined,
								owner: undefined
							}
						},
						remotes: {
							upstream: {
								url: ""
							}
						},
						step: "githubUpstream"
					});
				});
			});
		});

		it(`should log an error to the console when the call to "git.config" fails`, () => {
			git.config = jest.fn(() => Promise.reject("nope"));
			return run.githubUpstream(state).then(() => {
				expect(util.logger.log).toHaveBeenCalledTimes(1);
				expect(util.logger.log).toHaveBeenCalledWith("error", "nope");
			});
		});
	});

	describe("githubOrigin", () => {
		beforeEach(() => {
			state = {};
			git.config = jest.fn(() =>
				Promise.resolve("git@github.com:JohnDoe/test_repo.git")
			);
		});

		it(`should call "git.config" with the appropriate args`, () => {
			return run.githubOrigin(state).then(() => {
				expect(git.config).toHaveBeenCalledTimes(1);
				expect(git.config).toHaveBeenCalledWith({ remote: "origin" });
			});
		});

		it(`should set "state.remotes.origin.url" if "state.remotes" is undefined`, () => {
			return run.githubOrigin(state).then(() => {
				expect(state.remotes.origin).toHaveProperty("url");
				expect(state.remotes.origin.url).toEqual(
					"git@github.com:JohnDoe/test_repo.git"
				);
			});
		});

		it("should log an error to the console when the call to `util.exec` fails", () => {
			git.config = jest.fn(() => Promise.reject("nope"));
			return run.githubOrigin(state).then(() => {
				expect(util.logger.log).toHaveBeenCalledTimes(1);
				expect(util.logger.log).toHaveBeenCalledWith("error", "nope");
			});
		});

		describe("when an https uri is returned", () => {
			beforeEach(() => {
				git.config = jest.fn(() =>
					Promise.resolve("https://github.com/JohnDoe/test_repo.git")
				);
			});

			it("should extract repository owner and name", () => {
				return run.githubOrigin(state).then(() => {
					expect(state).toEqual({
						github: {
							origin: {
								owner: "JohnDoe",
								name: "test_repo"
							}
						},
						remotes: {
							origin: {
								url: "https://github.com/JohnDoe/test_repo.git"
							}
						},
						step: "githubOrigin"
					});
				});
			});
		});

		describe("when an ssh uri is returned", () => {
			it("should extract the correct repository owner and name given git@github.com:leankit-labs/tag-release.git", () => {
				return run.githubOrigin(state).then(() => {
					expect(state).toEqual({
						github: {
							origin: {
								owner: "JohnDoe",
								name: "test_repo"
							}
						},
						remotes: {
							origin: {
								url: "git@github.com:JohnDoe/test_repo.git"
							}
						},
						step: "githubOrigin"
					});
				});
			});
		});

		describe("when no data is returned", () => {
			it("should set the github object on state to an empty object", () => {
				git.config = jest.fn(() => Promise.resolve(""));
				return run.githubOrigin(state).then(() => {
					expect(state).toEqual({
						github: {
							origin: { owner: undefined, name: undefined }
						},
						remotes: {
							origin: {
								url: ""
							}
						},
						step: "githubOrigin"
					});
				});
			});
		});
	});

	describe("githubRelease", () => {
		GitHub.mockImplementation(jest.fn());
		let getRepo = jest.fn();
		let createRelease = jest.fn();

		const mockCreateRelease = (shouldResolve = true) => {
			if (shouldResolve) {
				createRelease = jest.fn(() =>
					Promise.resolve({
						data: {
							html_url: "http://example.com" // eslint-disable-line camelcase
						}
					})
				);

				return createRelease;
			}

			createRelease = jest.fn(() => Promise.reject("nope"));

			return createRelease;
		};

		const mockGitHub = (createReleaseShouldResolve = true) => {
			createRelease = mockCreateRelease(createReleaseShouldResolve);
			getRepo = jest.fn(() => ({
				createRelease
			}));

			return jest.fn(() => ({ getRepo }));
		};

		beforeEach(() => {
			state = {
				log:
					"* Added last feature\n* Added second feature\n* Added first feature",
				versions: {
					newVersion: "1.2.3"
				},
				github: {
					upstream: {
						owner: "someone-awesome",
						name: "something-awesome"
					}
				},
				token: "z8259r",
				prerelease: false
			};

			util.prompt = jest.fn(() =>
				Promise.resolve({ name: "Something awesome" })
			);
			GitHub.mockImplementation(mockGitHub());
		});

		it("should create a new GitHub client instance given a valid auth token", () => {
			return run.githubRelease(state).then(() => {
				expect(GitHub).toHaveBeenCalledTimes(1);
				expect(GitHub).toHaveBeenCalledWith({ token: "z8259r" });
			});
		});

		it("should prompt the user for a name for the release", () => {
			return run.githubRelease(state).then(() => {
				expect(util.prompt).toHaveBeenCalledTimes(1);
				expect(util.prompt).toHaveBeenCalledWith([
					{
						type: "input",
						name: "name",
						message: "What do you want to name the release?",
						default: "Added first feature"
					}
				]);
			});
		});

		it("should use use the most recent message from the log as the default value for the name of the release when prompting the user", () => {
			state.log =
				"* Added last feature\n* Added second feature\n* stavesacre rocks";
			return run.githubRelease(state).then(() => {
				expect(util.prompt).toHaveBeenCalledTimes(1);
				expect(util.prompt).toHaveBeenCalledWith([
					{
						type: "input",
						name: "name",
						message: "What do you want to name the release?",
						default: "stavesacre rocks"
					}
				]);
			});
		});

		it("should log the action to the console", () => {
			return run.githubRelease(state).then(() => {
				expect(util.log.begin).toHaveBeenCalledTimes(1);
				expect(util.log.end).toHaveBeenCalledTimes(1);
			});
		});

		it("should create an instance of a repository object with the previously fetched repository owner and name", () => {
			return run.githubRelease(state).then(() => {
				expect(getRepo).toHaveBeenCalledTimes(1);
				expect(getRepo).toHaveBeenCalledWith(
					"someone-awesome",
					"something-awesome"
				);
			});
		});

		it("should call the GitHub API to create a new release for the repository", () => {
			return run.githubRelease(state).then(() => {
				expect(createRelease).toHaveBeenCalledTimes(1);
				expect(createRelease).toHaveBeenCalledWith({
					tag_name: "v1.2.3", // eslint-disable-line camelcase
					name: "Something awesome",
					body:
						"* Added last feature\n* Added second feature\n* Added first feature",
					prerelease: false
				});
			});
		});

		describe("when prerelease is truthy", () => {
			it("should call the GitHub API to create a new release for the repository", () => {
				state.prerelease = true;
				return run.githubRelease(state).then(() => {
					expect(createRelease).toHaveBeenCalledTimes(1);
					expect(createRelease).toHaveBeenCalledWith({
						tag_name: "v1.2.3", // eslint-disable-line camelcase
						name: "Something awesome",
						body:
							"* Added last feature\n* Added second feature\n* Added first feature",
						prerelease: true
					});
				});
			});

			it("should call the GitHub API to create a new release for the repository", () => {
				state.prerelease = "some-identifier";
				return run.githubRelease(state).then(() => {
					expect(createRelease).toHaveBeenCalledTimes(1);
					expect(createRelease).toHaveBeenCalledWith({
						tag_name: "v1.2.3", // eslint-disable-line camelcase
						name: "Something awesome",
						body:
							"* Added last feature\n* Added second feature\n* Added first feature",
						prerelease: true
					});
				});
			});
		});

		it("should log an error to the console when the call to the API to create a release fails", () => {
			util.logger.log = jest.fn();
			GitHub.mockImplementation(mockGitHub(false));

			return run.githubRelease(state).then(() => {
				expect(util.logger.log).toHaveBeenCalledTimes(1);
				expect(util.logger.log).toHaveBeenCalledWith("nope");
			});
		});

		it("should resolve with state", () => {
			return run.githubRelease(state).then(result => {
				expect(result).toEqual(state);
			});
		});

		describe("releaseName provided", () => {
			it("should not prompt user and use releaseName for name", () => {
				state.releaseName = "provided release name";
				return run.githubRelease(state).then(() => {
					expect(util.prompt).toHaveBeenCalledTimes(0);
					expect(createRelease).toHaveBeenCalledTimes(1);
					expect(createRelease).toHaveBeenCalledWith({
						tag_name: "v1.2.3", // eslint-disable-line camelcase
						name: "provided release name",
						body:
							"* Added last feature\n* Added second feature\n* Added first feature",
						prerelease: false
					});
				});
			});
		});

		describe("when process.env.NO_OUTPUT is true", () => {
			beforeEach(() => {
				process.env.NO_OUTPUT = true;
			});

			it("should not prompt user and use default name for name", () => {
				return run.githubRelease(state).then(() => {
					expect(util.prompt).toHaveBeenCalledTimes(0);
					expect(createRelease).toHaveBeenCalledTimes(1);
					expect(createRelease).toHaveBeenCalledWith({
						tag_name: "v1.2.3", // eslint-disable-line camelcase
						name: "Added first feature",
						body:
							"* Added last feature\n* Added second feature\n* Added first feature",
						prerelease: false
					});
				});
			});

			afterEach(() => {
				delete process.env.NO_OUTPUT;
			});
		});
	});

	describe("checkForUncommittedChanges", () => {
		it("should call `command.uncommittedChangesExist`", () => {
			command.uncommittedChangesExist = jest.fn(() =>
				Promise.resolve("5c9f72f455a00d8e6db9a4be9b0ac2cd4885b0b4")
			);
			return run.checkForUncommittedChanges(state).then(() => {
				expect(command.uncommittedChangesExist).toHaveBeenCalledTimes(
					1
				);
			});
		});

		it("should persist the result to the workflow state", () => {
			command.uncommittedChangesExist = jest.fn(() =>
				Promise.resolve("5c9f72f455a00d8e6db9a4be9b0ac2cd4885b0b4")
			);
			return run.checkForUncommittedChanges(state).then(() => {
				expect(state).toHaveProperty("uncommittedChangesExist");
				expect(state.uncommittedChangesExist).toBeTruthy();
			});
		});

		it("should return false if there are no uncommitted changes", () => {
			command.uncommittedChangesExist = jest.fn(() =>
				Promise.resolve("")
			);
			return run.checkForUncommittedChanges(state).then(() => {
				expect(state).toHaveProperty("uncommittedChangesExist");
				expect(state.uncommittedChangesExist).toBeFalsy();
			});
		});
	});

	describe("gitStash", () => {
		it("should call `git.stash`", () => {
			git.stash = jest.fn(() => Promise.resolve());
			util.advise = jest.fn();
			return run.gitStash(state).then(() => {
				expect(git.stash).toHaveBeenCalledTimes(1);
				expect(util.advise).toHaveBeenCalledTimes(1);
				expect(util.advise).toHaveBeenCalledWith("gitStash", {
					exit: false
				});
			});
		});
	});

	describe("stashChanges", () => {
		describe("changes exist", () => {
			beforeEach(() => {
				command.uncommittedChangesExist = jest.fn(() =>
					Promise.resolve("some result")
				);
				run.stashChanges(state);
			});

			it("should call git.stash", () => {
				expect(git.stash).toHaveBeenCalledTimes(1);
			});

			it("should set step on state", () => {
				expect(state).toHaveProperty("step");
				expect(state.step).toEqual("stashChanges");
			});
		});

		describe("changes don't exist", () => {
			beforeEach(() => {
				command.uncommittedChangesExist = jest.fn(() =>
					Promise.resolve("")
				);
				run.stashChanges(state);
			});

			it("shouldn't call git.stash", () => {
				expect(git.stash).toHaveBeenCalledTimes(0);
			});

			it("should set step on state", () => {
				expect(state).toHaveProperty("step");
				expect(state.step).toEqual("stashChanges");
			});
		});
	});

	describe("stashIfUncommittedChangesExist", () => {
		it("should call `git.stash` when uncommitted changes exist", () => {
			state = { uncommittedChangesExist: true, step: "blah" };
			git.stash = jest.fn(() => Promise.resolve());
			return run.stashIfUncommittedChangesExist(state).then(() => {
				expect(git.stash).toHaveBeenCalledTimes(1);
			});
		});

		it("should not call `gitStash` when uncommitted changes do not exist", () => {
			git.stash = jest.fn(() => Promise.resolve());
			run.stashIfUncommittedChangesExist(state);
			expect(git.stash).not.toHaveBeenCalled();
		});
	});

	describe("verifyMasterBranch", () => {
		beforeEach(() => {
			command.branchExists = jest.fn(() => Promise.resolve(true));
			command.createLocalBranch = jest.fn();
		});

		it("should call `command.branchExists` with the appropriate arguments", () => {
			return run.verifyMasterBranch(state).then(() => {
				expect(command.branchExists).toHaveBeenCalledTimes(1);
				expect(command.branchExists).toHaveBeenCalledWith("master");
			});
		});

		it("should not call `command.createLocalBranch` when the branch does exist locally", () => {
			return run.verifyMasterBranch(state).then(() => {
				expect(command.createLocalBranch).not.toHaveBeenCalled();
			});
		});

		it("should call `command.createLocalBranch` when the branch doesn't exist locally", () => {
			command.branchExists = jest.fn(() => Promise.resolve(false));
			return run.verifyMasterBranch(state).then(() => {
				expect(command.createLocalBranch).toHaveBeenCalledTimes(1);
				expect(command.createLocalBranch).toHaveBeenCalledWith(
					"master"
				);
			});
		});
	});

	describe("verifyDevelopBranch", () => {
		beforeEach(() => {
			command.branchExists = jest.fn(() => Promise.resolve(true));
			command.createLocalBranch = jest.fn();
		});

		it("should call `command.branchExists` with the appropriate arguments", () => {
			return run.verifyDevelopBranch(state).then(() => {
				expect(command.branchExists).toHaveBeenCalledTimes(1);
				expect(command.branchExists).toHaveBeenCalledWith("develop");
			});
		});

		it("should not call `command.createLocalBranch` when the branch does exist locally", () => {
			return run.verifyDevelopBranch(state).then(() => {
				expect(command.createLocalBranch).not.toHaveBeenCalled();
			});
		});

		it("should call `command.createLocalBranch` when the branch doesn't exist locally", () => {
			state.hasDevelopBranch = true;
			command.branchExists = jest.fn(() => Promise.resolve(false));
			return run.verifyDevelopBranch(state).then(() => {
				expect(command.createLocalBranch).toHaveBeenCalledTimes(1);
				expect(command.createLocalBranch).toHaveBeenCalledWith(
					"develop"
				);
			});
		});

		it("should not call `command.createLocalBranch` when the branch doesn't exist locally and on remote", () => {
			command.branchExists = jest.fn(() => Promise.resolve(false));
			return run.verifyDevelopBranch(state).then(() => {
				expect(command.createLocalBranch).not.toHaveBeenCalled();
			});
		});
	});

	describe("resetMaster", () => {
		it("should call `command.resetBranch` with the appropriate arguments", () => {
			command.resetBranch = jest.fn(() => Promise.resolve());
			return run.gitResetMaster(state).then(() => {
				expect(command.resetBranch).toHaveBeenCalledTimes(1);
				expect(command.resetBranch).toHaveBeenCalledWith("master");
			});
		});
	});

	describe("resetDevelop", () => {
		it("should call `command.resetBranch` with the appropriate arguments", () => {
			state.hasDevelopBranch = true;
			command.resetBranch = jest.fn(() => Promise.resolve());
			return run.gitResetDevelop(state).then(() => {
				expect(command.resetBranch).toHaveBeenCalledTimes(1);
				expect(command.resetBranch).toHaveBeenCalledWith("develop");
			});
		});

		it("should not call `command.resetBranch` with no develop branch on upstream", () => {
			command.resetBranch = jest.fn(() => Promise.resolve());
			return run.gitResetDevelop(state).then(() => {
				expect(command.resetBranch).not.toHaveBeenCalled();
			});
		});
	});

	describe("checkoutTag", () => {
		it(`should call "command.checkoutTag" with the appropriate arguments when tag includes "v"`, () => {
			state.promote = "v1.1.1";
			command.checkoutTag = jest.fn(() => Promise.resolve());
			return run.checkoutTag(state).then(() => {
				expect(command.checkoutTag).toHaveBeenCalledTimes(1);
				expect(command.checkoutTag).toHaveBeenCalledWith({
					tag: "v1.1.1"
				});
			});
		});

		it(`should call "command.checkoutTag" with the appropriate arguments when tag excludes "v"`, () => {
			state.promote = "1.1.1";
			command.checkoutTag = jest.fn(() => Promise.resolve());
			return run.checkoutTag(state).then(() => {
				expect(command.checkoutTag).toHaveBeenCalledTimes(1);
				expect(command.checkoutTag).toHaveBeenCalledWith({
					tag: "v1.1.1"
				});
			});
		});
	});

	describe("gitGenerateRebaseCommitLog", () => {
		it("should call `command.generateRebaseCommitLog`", () => {
			command.generateRebaseCommitLog = jest.fn(() => Promise.resolve());
			return run.gitGenerateRebaseCommitLog(state).then(() => {
				expect(command.generateRebaseCommitLog).toHaveBeenCalledTimes(
					1
				);
			});
		});
	});

	describe("gitRemovePreReleaseCommits", () => {
		it("should call `command.removePreReleaseCommits`", () => {
			command.removePreReleaseCommits = jest.fn(() => Promise.resolve());
			return run.gitRemovePreReleaseCommits(state).then(() => {
				expect(command.removePreReleaseCommits).toHaveBeenCalledTimes(
					1
				);
			});
		});

		it("should call onError when `command.removePreReleaseCommits` fails", () => {
			command.removePreReleaseCommits = jest.fn(args => {
				return args.onError()();
			});
			return run.gitRemovePreReleaseCommits(state).then(() => {
				expect(conflictResolution.retryRebase).toHaveBeenCalledTimes(1);
			});
		});
	});

	describe("gitRebaseUpstreamMaster", () => {
		it("should call `command.rebaseUpstreamMaster`", () => {
			command.rebaseUpstreamMaster = jest.fn(() => Promise.resolve());
			return run.gitRebaseUpstreamMaster(state).then(() => {
				expect(command.rebaseUpstreamMaster).toHaveBeenCalledTimes(1);
			});
		});
	});

	describe("gitRemovePromotionBranches", () => {
		it("should call `command.removePromotionBranches`", () => {
			command.removePromotionBranches = jest.fn(() => Promise.resolve());
			return run.gitRemovePromotionBranches(state).then(() => {
				expect(command.removePromotionBranches).toHaveBeenCalledTimes(
					1
				);
			});
		});
	});

	describe("gitStageFiles", () => {
		it("should call `command.stageFiles`", () => {
			command.stageFiles = jest.fn(() => Promise.resolve());
			return run.gitStageFiles(state).then(() => {
				expect(command.stageFiles).toHaveBeenCalledTimes(1);
			});
		});
	});

	describe("gitRebaseContinue", () => {
		it("should call `command.rebaseContinue`", () => {
			command.rebaseContinue = jest.fn(() => Promise.resolve());
			return run.gitRebaseContinue(state).then(() => {
				expect(command.rebaseContinue).toHaveBeenCalledTimes(1);
			});
		});

		it("should call onError when `command.rebaseContinue` fails", () => {
			command.rebaseContinue = jest.fn(args => {
				return args.onError()();
			});
			return run.gitRebaseContinue(state).then(() => {
				expect(conflictResolution.retryRebase).toHaveBeenCalledTimes(1);
			});
		});
	});

	describe("setPromote", () => {
		it("should set `state.promote` based on current branch", () => {
			state.branch = "promote-release-v1.1.1-feature.0";
			return run.setPromote(state).then(() => {
				expect(state.promote).toEqual("v1.1.1-feature.0");
			});
		});
	});

	describe("getPackageScope", () => {
		beforeEach(() => {
			util.readJSONFile = jest.fn(() => ({}));
		});

		describe("qa", () => {
			it("should set CLI flag to default scope", () => {
				state.qa = true;
				return run.getPackageScope(state).then(() => {
					expect(state.scope).toEqual("@lk");
				});
			});

			it(`should use scope read from ".state.json" default scope`, () => {
				state.qa = true;
				util.readJSONFile = jest.fn(() => ({
					scope: "@my_scope"
				}));
				return run.getPackageScope(state).then(() => {
					expect(state.scope).toEqual("@my_scope");
				});
			});

			it("should set CLI flag to provided scope when passed by user and add @ when not provided", () => {
				state.qa = "aoe";
				return run.getPackageScope(state).then(() => {
					expect(state.scope).toEqual("@aoe");
				});
			});

			it("should set CLI flag to provided scope when passed by user", () => {
				state.qa = "@aoe";
				return run.getPackageScope(state).then(() => {
					expect(state.scope).toEqual("@aoe");
				});
			});
		});

		describe("pr", () => {
			it("should set CLI flag to default scope", () => {
				state.pr = true;
				return run.getPackageScope(state).then(() => {
					expect(state.scope).toEqual("@lk");
				});
			});

			it(`should use scope read from ".state.json" default scope`, () => {
				state.pr = true;
				util.readJSONFile = jest.fn(() => ({
					scope: "@my_scope"
				}));
				return run.getPackageScope(state).then(() => {
					expect(state.scope).toEqual("@my_scope");
				});
			});

			it("should set CLI flag to provided scope when passed by user and add @ when not provided", () => {
				state.pr = "aoe";
				return run.getPackageScope(state).then(() => {
					expect(state.scope).toEqual("@aoe");
				});
			});

			it("should set CLI flag to provided scope when passed by user", () => {
				state.pr = "@aoe";
				return run.getPackageScope(state).then(() => {
					expect(state.scope).toEqual("@aoe");
				});
			});
		});
	});

	describe("getScopedRepos", () => {
		const originalProcessExit = process.exit;

		beforeEach(() => {
			state.configPath = "./package.json";
			state.scope = "@lk";
			util.readJSONFile = jest.fn(() => ({
				devDependencies: { "@lk/over-watch": "1.1.1" },
				dependencies: { "@lk/watch-over": "1.1.1" }
			}));
			process.exit = jest.fn(() => {});
		});

		afterEach(() => {
			process.exit = originalProcessExit;
		});

		it(`should call "util.readJSONFile"`, () => {
			return run.getScopedRepos(state).then(() => {
				expect(util.readJSONFile).toHaveBeenCalledTimes(1);
				expect(util.readJSONFile).toHaveBeenCalledWith(
					"./package.json"
				);
			});
		});

		it("should resolve with repos within scope from config", () => {
			return run.getScopedRepos(state).then(repos => {
				expect(repos).toEqual(["over-watch", "watch-over"]);
			});
		});

		it("should advise when no dependencies or devDepdencies in package.json", () => {
			util.advise = jest.fn(() => Promise.resolve());
			util.readJSONFile = jest.fn(() => ({}));
			state.scope = "@aoe";

			return run.getScopedRepos(state).then(() => {
				expect(util.advise).toHaveBeenCalledTimes(1);
				expect(util.advise).toHaveBeenCalledWith("noPackagesInScope");
				expect(process.exit).toHaveBeenCalledTimes(1);
				expect(process.exit).toHaveBeenCalledWith(0);
			});
		});

		it("should advise when no repos are under scope within config and exit", () => {
			util.advise = jest.fn(() => Promise.resolve());
			state.scope = "@aoe";

			return run.getScopedRepos(state).then(() => {
				expect(util.advise).toHaveBeenCalledTimes(1);
				expect(util.advise).toHaveBeenCalledWith("noPackagesInScope");
				expect(process.exit).toHaveBeenCalledTimes(1);
				expect(process.exit).toHaveBeenCalledWith(0);
			});
		});
	});

	describe("askReposToUpdate", () => {
		beforeEach(() => {
			state.scope = "@lk";
			util.readJSONFile = jest.fn(() => ({
				devDependencies: { "@lk/over-watch": "1.1.1" },
				dependencies: { "@lk/watch-over": "1.1.1" }
			}));
			util.prompt = jest.fn(() =>
				Promise.resolve({ packagesToPromote: "over-watch" })
			);
		});

		it(`should call "util.prompt" with the appropriate arguments`, () => {
			return run.askReposToUpdate(state).then(() => {
				expect(util.prompt).toHaveBeenCalledTimes(1);
				expect(util.prompt).toHaveBeenCalledWith([
					{
						type: "checkbox",
						name: "packagesToPromote",
						message: "Which package(s) do you wish to update?",
						choices: ["over-watch", "watch-over"]
					}
				]);
			});
		});

		it("should persist the packagesToPromote to the workflow state", () => {
			return run.askReposToUpdate(state).then(() => {
				expect(state).toHaveProperty("packages");
				expect(state.packages).toEqual("over-watch");
			});
		});
	});

	describe("askVersion", () => {
		let getRepo = jest.fn();
		let listTags = jest.fn();

		const mockListTags = (shouldResolve = true) => {
			if (shouldResolve) {
				listTags = jest.fn(() =>
					Promise.resolve({
						data: [
							{
								name: "v1.1.1"
							},
							{
								name: "v2.0.0-feature.1"
							},
							{
								name: "v3.0.0-blah.0"
							}
						]
					})
				);

				return listTags;
			}

			listTags = jest.fn(() => Promise.reject("listTags fail"));

			return listTags;
		};

		const mockGitHub = (listTagsShouldResolve = true) => {
			listTags = mockListTags(listTagsShouldResolve);
			getRepo = jest.fn(() => ({
				listTags
			}));

			return jest.fn(() => ({ getRepo }));
		};

		beforeEach(() => {
			state = {
				github: {
					upstream: {
						owner: "someone-awesome",
						name: "something-awesome"
					}
				},
				token: "z8259r"
			};
			util.prompt = jest.fn(() =>
				Promise.resolve({ pkg: "over-watch", version: "1.1.1" })
			);
			GitHub.mockImplementation(mockGitHub());
		});

		it("should prompt the user for package version", () => {
			return run
				.askVersion(state, {
					pkg: "over-watch",
					version: "1.1.1"
				})()
				.then(() => {
					expect(util.prompt).toHaveBeenCalledTimes(1);
					expect(util.prompt).toHaveBeenCalledWith([
						{
							type: "list",
							name: "tag",
							message: `Update over-watch from 1.1.1 to:`,
							choices: [
								"1.1.1",
								"2.0.0-feature.1",
								"3.0.0-blah.0"
							]
						}
					]);
				});
		});
	});

	describe("askVersions", () => {
		beforeEach(() => {
			state.dependencies = [
				{
					pkg: "over-watch",
					version: "1.1.1"
				},
				{
					pkg: "watch-over",
					version: "2.2.2"
				}
			];
			util.prompt = jest.fn(() =>
				Promise.resolve({ pkg: "over-watch", version: "1.1.1" })
			);
		});

		it("should call 'sequence' with an array of dependencies", () => {
			return run.askVersions(state).then(() => {
				expect(sequence).toHaveBeenCalledTimes(1);
				expect(sequence).toHaveBeenCalledWith(expect.any(Array));
			});
		});

		it("should persist the dependencies to the workflow state", () => {
			return run.askVersions(state).then(() => {
				expect(state).toHaveProperty("dependencies");
				expect(state.dependencies).toEqual([
					{
						pkg: "over-watch",
						version: "2.0.0-new.0"
					},
					{
						pkg: "watch-over",
						version: "3.0.0-new.1"
					}
				]);
			});
		});

		it("should persist the identifier to the workflow state", () => {
			return run.askVersions(state).then(() => {
				expect(state).toHaveProperty("prerelease");
				expect(state.prerelease).toEqual("new");
			});
		});

		it("should persist the identifier to the workflow state using changeReason if no identifier exists in dependencies", () => {
			sequence.mockImplementation(
				jest.fn(() =>
					Promise.resolve([
						{
							pkg: "over-watch",
							version: "2.0.0"
						},
						{
							pkg: "watch-over",
							version: "3.0.0"
						}
					])
				)
			);
			state.changeReason = "magical powers";
			return run.askVersions(state).then(() => {
				expect(state).toHaveProperty("prerelease");
				expect(state.prerelease).toEqual("magical-powers");
			});
		});
	});

	describe("askChangeType", () => {
		beforeEach(() => {
			util.prompt = jest.fn(() =>
				Promise.resolve({ changeType: "feature" })
			);
		});

		it("should prompt the user for change type", () => {
			return run.askChangeType(state).then(() => {
				expect(util.prompt).toHaveBeenCalledTimes(1);
				expect(util.prompt).toHaveBeenCalledWith([
					{
						type: "list",
						name: "changeType",
						message: "What type of change is this work?",
						choices: ["feature", "defect", "rework"]
					}
				]);
			});
		});

		it("should persist the given change type to the workflow state", () => {
			return run.askChangeType(state).then(() => {
				expect(state).toHaveProperty("changeType");
				expect(state.changeType).toEqual("feature");
			});
		});

		it("should resolve when keepBranch is true", () => {
			state.keepBranch = true;
			return run.askChangeType(state).then(() => {
				expect(util.prompt).toHaveBeenCalledTimes(0);
			});
		});
	});

	describe("changeReasonValidator", () => {
		let changeReason;

		beforeEach(() => {
			changeReason = "this is some reason";
		});

		it("should return true with value", () => {
			expect(run.changeReasonValidator(changeReason)).toEqual(true);
		});

		it("should return false with no value", () => {
			changeReason = "";
			expect(run.changeReasonValidator(changeReason)).toEqual(false);
		});

		it("should return false with whitespace", () => {
			changeReason = "     ";
			expect(run.changeReasonValidator(changeReason)).toEqual(false);
		});
	});

	describe("askChangeReason", () => {
		beforeEach(() => {
			util.prompt = jest.fn(() =>
				Promise.resolve({ changeReason: "this is a reason" })
			);
		});

		it("should prompt the user for change reason", () => {
			return run.askChangeReason(state).then(() => {
				expect(util.prompt).toHaveBeenCalledTimes(1);
				expect(util.prompt).toHaveBeenCalledWith([
					{
						type: "input",
						name: "changeReason",
						message:
							"What is the reason for this change? (required)",
						validate: run.changeReasonValidator
					}
				]);
			});
		});

		it("should persist the given change reason to the workflow state", () => {
			return run.askChangeReason(state).then(() => {
				expect(state).toHaveProperty("changeReason");
				expect(state.changeReason).toEqual("this is a reason");
			});
		});

		it("should strip quotes from changeReason before saving to state", () => {
			util.prompt = jest.fn(() =>
				Promise.resolve({
					changeReason: `this is a reason with "double quotes" and 'single quotes'`
				})
			);

			return run.askChangeReason(state).then(() => {
				expect(state).toHaveProperty("changeReason");
				expect(state.changeReason).toEqual(
					"this is a reason with double quotes and 'single quotes'"
				);
			});
		});
	});

	describe("checkoutAndCreateBranch", () => {
		beforeEach(() => {
			state = {
				branch: "feature-new-menu",
				keepBranch: false
			};
			command.checkoutAndCreateBranch = jest.fn(() => Promise.resolve());
		});

		describe("when keepBranch is true", () => {
			it(`should resolve and not call "checkoutAndCreateBranch"`, () => {
				state.keepBranch = true;
				return run.checkoutAndCreateBranch(state).then(() => {
					expect(
						command.checkoutAndCreateBranch
					).toHaveBeenCalledTimes(0);
				});
			});
		});

		it("should call `command.checkoutAndCreateBranch`", () => {
			return run.checkoutAndCreateBranch(state).then(() => {
				expect(command.checkoutAndCreateBranch).toHaveBeenCalledTimes(
					1
				);
			});
		});

		describe("when handling error", () => {
			beforeEach(() => {
				command.checkoutAndCreateBranch = jest.fn((...args) => {
					return args[0].onError({
						message: `A branch named '${
							state.branch
						}' already exists`
					})();
				});

				util.advise = jest.fn(() => Promise.resolve());
			});

			it("should handle branch already exists error", () => {
				return run.checkoutAndCreateBranch(state).catch(() => {
					expect(
						command.checkoutAndCreateBranch
					).toHaveBeenCalledTimes(1);
					expect(util.advise).toHaveBeenCalledTimes(1);
					expect(util.advise).toHaveBeenCalledWith(
						"gitBranchAlreadyExists"
					);
				});
			});

			it("should handle generic error", () => {
				command.checkoutAndCreateBranch = jest.fn((...args) => {
					return args[0].onError({ message: "some generic error" })();
				});
				return run.checkoutAndCreateBranch(state).catch(() => {
					expect(
						command.checkoutAndCreateBranch
					).toHaveBeenCalledTimes(1);
					expect(util.advise).toHaveBeenCalledTimes(1);
					expect(util.advise).toHaveBeenCalledWith(
						"gitCommandFailed"
					);
				});
			});
		});
	});

	describe("updateDependencies", () => {
		beforeEach(() => {
			state = {
				configPath: "./package.json",
				scope: "@lk",
				dependencies: [
					{
						pkg: "over-watch",
						version: "1.1.1"
					},
					{
						pkg: "watch-over",
						version: "2.2.2"
					}
				]
			};
			util.readJSONFile = jest.fn(() => ({
				devDependencies: { "@lk/over-watch": "1.1.1" },
				dependencies: { "@lk/watch-over": "1.1.1" }
			}));
			util.writeJSONFile = jest.fn(() => {});
		});

		it("should call `util.readJSONFile`", () => {
			return run.updateDependencies(state).then(() => {
				expect(util.readJSONFile).toHaveBeenCalledTimes(1);
				expect(util.readJSONFile).toHaveBeenCalledWith(
					state.configPath
				);
			});
		});

		it("should call `util.writeJSONFile`", () => {
			return run.updateDependencies(state).then(() => {
				expect(util.writeJSONFile).toHaveBeenCalledTimes(1);
				expect(util.writeJSONFile).toHaveBeenCalledWith(
					state.configPath,
					{
						dependencies: {
							"@lk/watch-over": "2.2.2"
						},
						devDependencies: {
							"@lk/over-watch": "1.1.1"
						}
					}
				);
			});
		});
	});

	describe("gitCommitBumpMessage", () => {
		beforeEach(() => {
			git.commit = jest.fn(() => Promise.resolve());
		});

		it("should call `command.commit` with the appropriate argument", () => {
			state.dependencies = [
				{
					pkg: "over-watch",
					version: "1.1.1"
				},
				{
					pkg: "watch-over",
					version: "2.2.2"
				}
			];
			state.changeReason = "this is my reason";
			return run.gitCommitBumpMessage(state).then(() => {
				expect(git.commit).toHaveBeenCalledTimes(1);
				expect(git.commit).toHaveBeenCalledWith({
					comment:
						"Bumped over-watch to 1.1.1, watch-over to 2.2.2: this is my reason"
				});
			});
		});
	});

	describe("verifyPackagesToPromote", () => {
		const originalProcessExit = process.exit;

		beforeEach(() => {
			state.packages = ["over-watch", "watch-over"];
			process.exit = jest.fn(() => {});
		});

		afterEach(() => {
			process.exit = originalProcessExit;
		});

		it("should resolve when there are packages", () => {
			util.advise = jest.fn(() => Promise.resolve());
			return run.verifyPackagesToPromote(state).then(() => {
				expect(util.advise).toHaveBeenCalledTimes(0);
				expect(process.exit).toHaveBeenCalledTimes(0);
			});
		});

		it("should advise when no packages to promote and exit", () => {
			util.advise = jest.fn(() => Promise.resolve());
			state.packages = [];

			return run.verifyPackagesToPromote(state).then(() => {
				expect(util.advise).toHaveBeenCalledTimes(1);
				expect(util.advise).toHaveBeenCalledWith("noPackages");
			});
		});
	});

	describe("gitRebaseUpstreamBranch", () => {
		beforeEach(() => {
			command.rebaseUpstreamBranch = jest.fn(() => Promise.resolve());
		});

		it("should call `command.gitRebaseUpstreamBranch` with the appropriate argument", () => {
			state.branch = "feature-branch";
			return run.gitRebaseUpstreamBranch(state).then(() => {
				expect(command.rebaseUpstreamBranch).toHaveBeenCalledTimes(1);
				expect(command.rebaseUpstreamBranch).toHaveBeenCalledWith({
					branch: "feature-branch"
				});
			});
		});
	});

	describe("gitRebaseUpstreamDevelop", () => {
		beforeEach(() => {
			command.rebaseUpstreamDevelop = jest.fn(() => Promise.resolve());
		});

		it("should call `command.gitRebaseUpstreamDevelop` with the appropriate argument", () => {
			return run.gitRebaseUpstreamDevelop(state).then(() => {
				expect(command.rebaseUpstreamDevelop).toHaveBeenCalledTimes(1);
			});
		});
	});

	describe("getReposFromBumpCommit", () => {
		beforeEach(() => {
			command.getLatestCommitMessage = jest.fn(() => {
				return Promise.resolve(
					"Bumped web-board-slice to 3.1.0, web-card-slice to 13.1.0, web-common-ui to 15.7.0: Users needed a change"
				);
			});
		});

		it("should call `command.getLatestCommitMessage`", () => {
			return run.getReposFromBumpCommit(state).then(() => {
				expect(command.getLatestCommitMessage).toHaveBeenCalledTimes(1);
			});
		});

		it("should persist the `packages` on the state", () => {
			return run.getReposFromBumpCommit(state).then(() => {
				expect(state).toHaveProperty("packages");
				expect(state.packages).toEqual([
					"web-board-slice",
					"web-card-slice",
					"web-common-ui"
				]);
			});
		});

		it("should persist the `changeReason` on the state", () => {
			return run.getReposFromBumpCommit(state).then(() => {
				expect(state).toHaveProperty("changeReason");
				expect(state.changeReason).toEqual("Users needed a change");
			});
		});

		it("should use empty array and string when no matches are found in commit message", () => {
			command.getLatestCommitMessage = jest.fn(() => {
				return Promise.resolve("Some random commit message");
			});
			return run.getReposFromBumpCommit(state).then(() => {
				expect(state).toHaveProperty("packages");
				expect(state).toHaveProperty("changeReason");
				expect(state.packages).toEqual([]);
				expect(state.changeReason).toEqual("");
			});
		});

		it("should persist the `packages` on the state", () => {
			return run.getReposFromBumpCommit(state).then(() => {
				expect(state).toHaveProperty("packages");
				expect(state.packages).toEqual([
					"web-board-slice",
					"web-card-slice",
					"web-common-ui"
				]);
			});
		});
	});

	describe("gitAmendCommitBumpMessage", () => {
		beforeEach(() => {
			state = {
				dependencies: [
					{
						pkg: "web-common-ui",
						version: "1.1.1-new.0"
					},
					{
						pkg: "web-board-slice",
						version: "2.2.2-new.1"
					}
				],
				changeReason: "This is the reason"
			};
			command.commitAmend = jest.fn(() => Promise.resolve());
		});

		it(`should called "command.commitAmend" with appropriate arguments`, () => {
			return run.gitAmendCommitBumpMessage(state).then(() => {
				expect(command.commitAmend).toHaveBeenCalledTimes(1);
				expect(command.commitAmend).toHaveBeenCalledWith({
					comment:
						"Bumped web-common-ui to 1.1.1-new.0, web-board-slice to 2.2.2-new.1: This is the reason"
				});
			});
		});

		it("should persist the `bumpComment` on the state", () => {
			return run.gitAmendCommitBumpMessage(state).then(() => {
				expect(state).toHaveProperty("bumpComment");
				expect(state.bumpComment).toEqual(
					"Bumped web-common-ui to 1.1.1-new.0, web-board-slice to 2.2.2-new.1: This is the reason"
				);
			});
		});
	});

	describe("getCurrentDependencyVersions", () => {
		beforeEach(() => {
			state = {
				configPath: "./blah",
				packages: ["another-ui", "my-secret-repo"],
				scope: "@lk"
			};
			util.readJSONFile = jest.fn(() => ({
				devDependencies: {
					"@lk/another-ui": "1.0.0",
					"@lk/my-thing": "14.0.0"
				},
				dependencies: {
					"@lk/web-common-ui": "3.0.0",
					"@lk/my-secret-repo": "4.0.0"
				}
			}));
		});

		it("should call `util.readJSONFile` with path", () => {
			return run.getCurrentDependencyVersions(state).then(() => {
				expect(util.readJSONFile).toHaveBeenCalledTimes(1);
				expect(util.readJSONFile).toHaveBeenCalledWith(
					state.configPath
				);
			});
		});

		it("should push package dependencies onto state", () => {
			return run.getCurrentDependencyVersions(state).then(() => {
				expect(state).toHaveProperty("dependencies");
				expect(state.dependencies).toEqual([
					{
						pkg: "another-ui",
						version: "1.0.0"
					},
					{
						pkg: "my-secret-repo",
						version: "4.0.0"
					}
				]);
			});
		});
	});

	describe("createGithubPullRequestAganistBase", () => {
		let getRepo = jest.fn();
		let getIssues = jest.fn();
		let createPullRequest = jest.fn();
		let editIssue = jest.fn();

		const mockCreatePullRequest = (shouldResolve = true) => {
			if (shouldResolve) {
				createPullRequest = jest.fn(() =>
					Promise.resolve({
						data: {
							html_url: "http://example.com", // eslint-disable-line camelcase
							number: 47
						}
					})
				);

				return createPullRequest;
			}

			createPullRequest = jest.fn(() =>
				Promise.reject("pullRequest fail")
			);

			return createPullRequest;
		};

		const mockEditIssues = (shouldResolve = true) => {
			if (shouldResolve) {
				editIssue = jest.fn(() => Promise.resolve());

				return editIssue;
			}

			editIssue = jest.fn(() => Promise.reject("editIssues fail"));

			return editIssue;
		};

		const mockGitHub = (
			createPullRequestShouldResolve = true,
			editIssueShouldResolve = true
		) => {
			createPullRequest = mockCreatePullRequest(
				createPullRequestShouldResolve
			);
			editIssue = mockEditIssues(editIssueShouldResolve);
			getRepo = jest.fn(() => ({
				createPullRequest
			}));
			getIssues = jest.fn(() => ({
				editIssue
			}));

			return jest.fn(() => ({ getRepo, getIssues }));
		};

		beforeEach(() => {
			state = {
				github: {
					upstream: {
						owner: "someone-awesome",
						name: "something-awesome"
					}
				},
				token: "z8259r",
				prerelease: false,
				branch: "feature-branch",
				bumpComment:
					"Bumped my-package to 1.1.1: This is my reason for the change"
			};

			util.logger.log = jest.fn();
			util.prompt = jest.fn(() =>
				Promise.resolve({ name: "Something awesome" })
			);
			GitHub.mockImplementation(mockGitHub());
		});

		describe("when bumpComment is falsy", () => {
			it("should call `editIssue` with issue number and label", () => {
				state.bumpComment = "";
				return run
					.createGithubPullRequestAganistBase(state)
					.then(() => {
						expect(editIssue).toHaveBeenCalledTimes(1);
						expect(editIssue).toHaveBeenCalledWith(47, {
							labels: ["Ready to Merge Into Develop"]
						});
					});
			});
		});

		describe(`when there is a "develop" branch`, () => {
			it("should call `editIssue` with issue number and label", () => {
				state.hasDevelopBranch = true;
				return run
					.createGithubPullRequestAganistBase(state)
					.then(() => {
						expect(editIssue).toHaveBeenCalledTimes(1);
						expect(editIssue).toHaveBeenCalledWith(47, {
							labels: ["Ready to Merge Into Develop"]
						});
					});
			});
		});

		it("should create a new GitHub client instance given a valid auth token", () => {
			return run.createGithubPullRequestAganistBase(state).then(() => {
				expect(GitHub).toHaveBeenCalledTimes(1);
				expect(GitHub).toHaveBeenCalledWith({ token: "z8259r" });
			});
		});

		it("should log the action to the console", () => {
			return run.createGithubPullRequestAganistBase(state).then(() => {
				expect(util.log.begin).toHaveBeenCalledTimes(1);
				expect(util.log.end).toHaveBeenCalledTimes(1);
			});
		});

		it("should create an instance of a repository object with the previously fetched repository owner and name", () => {
			return run.createGithubPullRequestAganistBase(state).then(() => {
				expect(getRepo).toHaveBeenCalledTimes(1);
				expect(getRepo).toHaveBeenCalledWith(
					"someone-awesome",
					"something-awesome"
				);
			});
		});

		it("should call `editIssue` with issue number and label", () => {
			util.logger.log = jest.fn();
			return run.createGithubPullRequestAganistBase(state).then(() => {
				expect(editIssue).toHaveBeenCalledTimes(1);
				expect(editIssue).toHaveBeenCalledWith(47, {
					labels: ["Ready to Merge Into Develop"]
				});
			});
		});

		it("should log an error to the console when the call to the API to create a release fails", () => {
			GitHub.mockImplementation(mockGitHub(false, true));

			return run.createGithubPullRequestAganistBase(state).then(() => {
				expect(util.logger.log).toHaveBeenCalledTimes(1);
				expect(util.logger.log).toHaveBeenCalledWith(
					"pullRequest fail"
				);
			});
		});

		it("should log an error to the console when the call to the API to edit issues fails", () => {
			GitHub.mockImplementation(mockGitHub(true, false));

			return run.createGithubPullRequestAganistBase(state).then(() => {
				expect(util.logger.log).toHaveBeenCalledTimes(1);
				expect(util.logger.log).toHaveBeenCalledWith("editIssues fail");
			});
		});
	});

	describe("createGithubPullRequestAganistBranch", () => {
		let getRepo = jest.fn();
		let getIssues = jest.fn();
		let createPullRequest = jest.fn();
		let editIssue = jest.fn();

		const mockCreatePullRequest = (shouldResolve = true) => {
			if (shouldResolve) {
				createPullRequest = jest.fn(() =>
					Promise.resolve({
						data: {
							html_url: "http://example.com", // eslint-disable-line camelcase
							number: 47
						}
					})
				);

				return createPullRequest;
			}

			createPullRequest = jest.fn(() =>
				Promise.reject("pullRequest fail")
			);

			return createPullRequest;
		};

		const mockEditIssues = (shouldResolve = true) => {
			if (shouldResolve) {
				editIssue = jest.fn(() => Promise.resolve());

				return editIssue;
			}

			editIssue = jest.fn(() => Promise.reject("editIssues fail"));

			return editIssue;
		};

		const mockGitHub = (
			createPullRequestShouldResolve = true,
			editIssueShouldResolve = true
		) => {
			createPullRequest = mockCreatePullRequest(
				createPullRequestShouldResolve
			);
			editIssue = mockEditIssues(editIssueShouldResolve);
			getRepo = jest.fn(() => ({
				createPullRequest
			}));
			getIssues = jest.fn(() => ({
				editIssue
			}));

			return jest.fn(() => ({ getRepo, getIssues }));
		};

		beforeEach(() => {
			state = {
				github: {
					upstream: {
						owner: "someone-awesome",
						name: "something-awesome"
					},
					origin: { owner: "someone-awesome-origin" }
				},
				token: "z8259r",
				prerelease: false,
				branch: "feature-branch",
				pullRequest: {
					title: "This is my pull request title",
					body: "This is my pull request body"
				}
			};

			util.logger.log = jest.fn();
			util.prompt = jest.fn(() =>
				Promise.resolve({ name: "Something awesome" })
			);
			GitHub.mockImplementation(mockGitHub());
		});

		describe("when bumpComment is falsy", () => {
			it("should call `editIssue` with issue number and label", () => {
				state.bumpComment = "";
				return run
					.createGithubPullRequestAganistBranch(state)
					.then(() => {
						expect(editIssue).toHaveBeenCalledTimes(1);
						expect(editIssue).toHaveBeenCalledWith(47, {
							labels: ["Needs Developer Review"]
						});
					});
			});
		});

		describe("when devBranch provided", () => {
			it("should call `editIssue` with issue number and label", () => {
				util.logger.log = jest.fn();
				state.devBranch = "master";
				return run
					.createGithubPullRequestAganistBranch(state)
					.then(() => {
						expect(editIssue).toHaveBeenCalledTimes(1);
						expect(editIssue).toHaveBeenCalledWith(47, {
							labels: ["Needs Developer Review"]
						});
					});
			});
		});

		it("should create a new GitHub client instance given a valid auth token", () => {
			return run.createGithubPullRequestAganistBranch(state).then(() => {
				expect(GitHub).toHaveBeenCalledTimes(1);
				expect(GitHub).toHaveBeenCalledWith({ token: "z8259r" });
			});
		});

		it("should log the action to the console", () => {
			return run.createGithubPullRequestAganistBranch(state).then(() => {
				expect(util.log.begin).toHaveBeenCalledTimes(1);
				expect(util.log.end).toHaveBeenCalledTimes(1);
			});
		});

		it("should create an instance of a repository object with the previously fetched repository owner and name", () => {
			return run.createGithubPullRequestAganistBranch(state).then(() => {
				expect(getRepo).toHaveBeenCalledTimes(1);
				expect(getRepo).toHaveBeenCalledWith(
					"someone-awesome",
					"something-awesome"
				);
			});
		});

		it("should call `editIssue` with issue number and label", () => {
			util.logger.log = jest.fn();
			return run.createGithubPullRequestAganistBranch(state).then(() => {
				expect(editIssue).toHaveBeenCalledTimes(1);
				expect(editIssue).toHaveBeenCalledWith(47, {
					labels: ["Needs Developer Review"]
				});
			});
		});

		it("should log an error to the console when the call to the API to create a release fails", () => {
			GitHub.mockImplementation(mockGitHub(false, true));

			return run.createGithubPullRequestAganistBranch(state).then(() => {
				expect(util.logger.log).toHaveBeenCalledTimes(1);
				expect(util.logger.log).toHaveBeenCalledWith(
					"pullRequest fail"
				);
			});
		});

		it("should log an error to the console when the call to the API to edit issues fails", () => {
			GitHub.mockImplementation(mockGitHub(true, false));

			return run.createGithubPullRequestAganistBranch(state).then(() => {
				expect(util.logger.log).toHaveBeenCalledTimes(1);
				expect(util.logger.log).toHaveBeenCalledWith("editIssues fail");
			});
		});
	});

	describe("saveState", () => {
		let joinSpy;

		beforeEach(() => {
			state = {
				scope: "@lk"
			};
			util.writeJSONFile = jest.fn(() => {});
			joinSpy = jest
				.spyOn(path, "join")
				.mockImplementation(() => "my_path/");
		});

		afterEach(() => {
			joinSpy.mockRestore();
		});

		it("should call `util.writeJSONFile` with path and content", () => {
			return run.saveState(state).then(() => {
				expect(util.writeJSONFile).toHaveBeenCalledTimes(1);
				expect(util.writeJSONFile).toHaveBeenCalledWith("my_path/", {
					scope: "@lk"
				});
			});
		});

		it("should advise when the call to `util.writeJSONFile` fails", () => {
			util.advise = jest.fn(() => Promise.resolve());
			util.writeJSONFile = jest.fn(() => {
				throw new Error("nope");
			});

			return run.saveState(state).then(() => {
				expect(util.writeJSONFile).toHaveBeenCalledTimes(1);
				expect(util.advise).toHaveBeenCalledTimes(1);
				expect(util.advise).toHaveBeenCalledWith("saveState");
			});
		});
	});

	describe("cleanUpTmpFiles", () => {
		let joinSpy;

		beforeEach(() => {
			command.cleanUp = jest.fn(() => Promise.resolve());
			util.deleteFile = jest.fn(() => {});
			joinSpy = jest
				.spyOn(path, "join")
				.mockImplementation(() => "my_path/");
		});

		afterEach(() => {
			joinSpy.mockRestore();
		});

		it("should call `util.deleteFile` with path", () => {
			return run.cleanUpTmpFiles(state).then(() => {
				expect(util.deleteFile).toHaveBeenCalledTimes(2);
				expect(util.deleteFile).toHaveBeenCalledWith("my_path/");
			});
		});

		it("should call `command.cleanUp`", () => {
			return run.cleanUpTmpFiles(state).then(() => {
				expect(command.cleanUp).toHaveBeenCalledTimes(1);
			});
		});
	});

	describe("promptBranchName", () => {
		beforeEach(() => {
			state = {
				changeType: "feature",
				prerelease: "magic",
				keepBranch: false
			};
			util.prompt = jest.fn(() =>
				Promise.resolve({ branchName: "feature-magic" })
			);
		});

		it("should call `util.prompt` with the appropriate arguments", () => {
			return run.promptBranchName(state).then(() => {
				expect(util.prompt).toHaveBeenCalledTimes(1);
				expect(util.prompt).toHaveBeenCalledWith([
					{
						type: "input",
						name: "branchName",
						message: "What do you want your branch name to be?",
						default: "feature-magic"
					}
				]);
			});
		});

		it("should persist the `branchName` to the workflow state", () => {
			return run.promptBranchName(state).then(() => {
				expect(state).toHaveProperty("branch");
				expect(state.branch).toEqual("feature-magic");
			});
		});

		it("should resolve when keepBranch is true", () => {
			state.keepBranch = true;
			return run.promptBranchName(state).then(() => {
				expect(util.prompt).toHaveBeenCalledTimes(0);
			});
		});
	});

	describe("getTagsFromRepo", () => {
		let getRepo = jest.fn();
		let listTags = jest.fn();

		const mockListTags = (shouldResolve = true) => {
			if (shouldResolve) {
				listTags = jest.fn(() =>
					Promise.resolve({
						data: [
							{
								name: "v1.1.1"
							},
							{
								name: "v2.0.0-feature.1"
							},
							{
								name: "v3.0.0-blah.0"
							}
						]
					})
				);

				return listTags;
			}

			listTags = jest.fn(() => Promise.reject("listTags fail"));

			return listTags;
		};

		const mockGitHub = (listTagsShouldResolve = true) => {
			listTags = mockListTags(listTagsShouldResolve);
			getRepo = jest.fn(() => ({
				listTags
			}));

			return jest.fn(() => ({ getRepo }));
		};

		beforeEach(() => {
			state = {
				github: {
					upstream: {
						owner: "someone-awesome",
						name: "something-awesome"
					}
				},
				token: "z8259r"
			};
			GitHub.mockImplementation(mockGitHub());
		});

		it("should create a new GitHub client instance given a valid auth token", () => {
			return run.getTagsFromRepo(state, "my-secret-repo").then(() => {
				expect(GitHub).toHaveBeenCalledTimes(1);
				expect(GitHub).toHaveBeenCalledWith({ token: "z8259r" });
			});
		});

		it("should create an instance of a repository object with the previously fetched repository owner and passed in name", () => {
			return run.getTagsFromRepo(state, "my-secret-repo").then(() => {
				expect(getRepo).toHaveBeenCalledTimes(1);
				expect(getRepo).toHaveBeenCalledWith(
					"someone-awesome",
					"my-secret-repo"
				);
			});
		});

		it("should call the GitHub API to get a list of tags from the repository", () => {
			return run.getTagsFromRepo(state, "my-secret-repo").then(result => {
				expect(listTags).toHaveBeenCalledTimes(1);
				expect(result).toEqual([
					"1.1.1",
					"2.0.0-feature.1",
					"3.0.0-blah.0"
				]);
			});
		});

		it("should log an error to the console when the call to the API to get a list of tags fails", () => {
			util.logger.log = jest.fn();
			GitHub.mockImplementation(mockGitHub(false));

			return run.getTagsFromRepo(state).then(() => {
				expect(util.logger.log).toHaveBeenCalledTimes(1);
				expect(util.logger.log).toHaveBeenCalledWith("listTags fail");
			});
		});
	});

	describe("verifyRemotes", () => {
		beforeEach(() => {
			git.remote = jest.fn(() => Promise.resolve(""));
		});

		it("should call `util.exec` with the appropriate arguments to get the remotes", () => {
			return run.verifyRemotes(state).then(() => {
				expect(git.remote).toHaveBeenCalledTimes(1);
			});
		});

		describe("when setting state", () => {
			it("should set origin and upstream to true", () => {
				git.remote = jest.fn(() =>
					Promise.resolve("origin\nupstream\n")
				);
				return run.verifyRemotes(state).then(() => {
					expect(state.remotes).toHaveProperty("origin");
					expect(state.remotes).toHaveProperty("upstream");
					expect(state.remotes.origin.exists).toEqual(true);
					expect(state.remotes.upstream.exists).toEqual(true);
				});
			});

			it("should set origin and upstream to false", () => {
				git.remote = jest.fn(() => Promise.resolve(""));
				return run.verifyRemotes(state).then(() => {
					expect(state.remotes).toHaveProperty("origin");
					expect(state.remotes).toHaveProperty("upstream");
					expect(state.remotes.origin.exists).toEqual(false);
					expect(state.remotes.upstream.exists).toEqual(false);
				});
			});

			it("should set origin to false and upstream to true", () => {
				git.remote = jest.fn(() => Promise.resolve("upstream\n"));
				return run.verifyRemotes(state).then(() => {
					expect(state.remotes).toHaveProperty("origin");
					expect(state.remotes).toHaveProperty("upstream");
					expect(state.remotes.origin.exists).toEqual(false);
					expect(state.remotes.upstream.exists).toEqual(true);
				});
			});

			it("should set origin to true and upstream to false", () => {
				git.remote = jest.fn(() => Promise.resolve("origin\n"));
				return run.verifyRemotes(state).then(() => {
					expect(state.remotes).toHaveProperty("origin");
					expect(state.remotes).toHaveProperty("upstream");
					expect(state.remotes.origin.exists).toEqual(true);
					expect(state.remotes.upstream.exists).toEqual(false);
				});
			});
		});
	});

	describe("verifyOrigin", () => {
		beforeEach(() => {
			state = {
				remotes: {
					origin: {
						exists: true
					}
				}
			};
		});
		it("should resolve when remote origin exists", () => {
			return run.verifyOrigin(state).then(() => {
				expect(util.advise).not.toHaveBeenCalled();
			});
		});

		it("should log the action to the console", () => {
			return run.verifyOrigin(state).then(() => {
				expect(util.log.begin).toHaveBeenCalledTimes(1);
				expect(util.log.begin).toHaveBeenCalledWith(
					"Verifying origin remote"
				);
				expect(util.log.end).toHaveBeenCalledTimes(1);
			});
		});

		it("should advise when remote origin doesn't exists", () => {
			state = {
				remotes: {
					origin: {
						exists: false
					}
				}
			};

			return run.verifyOrigin(state).then(() => {
				expect(util.advise).toHaveBeenCalledTimes(1);
				expect(util.advise).toHaveBeenCalledWith("gitOrigin");
			});
		});
	});

	describe("verifyUpstream", () => {
		let getRepo = jest.fn();
		let getDetails = jest.fn();

		/* eslint-disable camelcase */
		const mockGetDetails = (shouldResolve = true, hasParent = true) => {
			if (shouldResolve) {
				if (hasParent) {
					getDetails = jest.fn(() =>
						Promise.resolve({
							data: {
								parent: {
									ssh_url:
										"git@github.com:johndoe/hasParent-repo.git",
									svn_url:
										"https://github.com/johndoe/noParent-repo.git"
								}
							}
						})
					);
				} else {
					getDetails = jest.fn(() =>
						Promise.resolve({
							data: {
								ssh_url:
									"git@github.com:johndoe/noParent-repo.git",
								svn_url:
									"https://github.com/johndoe/noParent-repo.git"
							}
						})
					);
				}

				return getDetails;
			}

			getDetails = jest.fn(() => Promise.reject("getDetails fail"));

			return getDetails;
		};
		/* eslint-enable camelcase */

		const mockGitHub = (
			getDetailsShouldResolve = true,
			hasParent = true
		) => {
			getDetails = mockGetDetails(getDetailsShouldResolve, hasParent);
			getRepo = jest.fn(() => ({
				getDetails
			}));

			return jest.fn(() => ({ getRepo }));
		};

		beforeEach(() => {
			state = {
				github: {
					origin: {
						owner: "someone-awesome",
						name: "something-awesome"
					}
				},
				token: "z8259r",
				remotes: {
					origin: {
						exists: true,
						url: "git@github.com:johnsmith/awesome-repo.git"
					},
					upstream: {
						exists: false
					}
				}
			};
			util.exec = jest.fn(() => Promise.resolve(""));
			GitHub.mockImplementation(mockGitHub());
		});

		it("should log an error to the console when the call to `util.exec` fails", () => {
			util.exec = jest.fn(() => Promise.reject("nope"));
			util.logger.log = jest.fn(() => {});
			return run.verifyUpstream(state).then(() => {
				expect(util.logger.log).toHaveBeenCalledTimes(1);
				expect(util.logger.log).toHaveBeenCalledWith("nope");
			});
		});

		it("should log an error to the console when the call to the API to get detailss fails", () => {
			util.logger.log = jest.fn(arg => arg);
			GitHub.mockImplementation(mockGitHub(false));

			return run.verifyUpstream(state).then(() => {
				expect(util.logger.log).toHaveBeenCalledTimes(1);
				expect(util.logger.log).toHaveBeenCalledWith("getDetails fail");
			});
		});

		describe("when upstream remote exists", () => {
			it("should log the action to console", () => {
				state.remotes.upstream.exists = true;

				return run.verifyUpstream(state).then(() => {
					expect(util.log.begin).toHaveBeenCalledTimes(1);
					expect(util.log.begin).toHaveBeenCalledWith(
						"Verifying upstream remote"
					);
					expect(util.log.end).toHaveBeenCalledTimes(1);
				});
			});
		});

		describe("when upstream remote doesn't exist", () => {
			it("should log the action to console", () => {
				return run.verifyUpstream(state).then(() => {
					expect(util.log.begin).toHaveBeenCalledTimes(2);
					expect(util.log.begin).toHaveBeenCalledWith(
						"Creating upstream remote"
					);
					expect(util.log.end).toHaveBeenCalledTimes(2);
				});
			});

			describe("when repository is parent", () => {
				it("should create remote upstream", () => {
					GitHub.mockImplementation(mockGitHub(true, false));

					return run.verifyUpstream(state).then(() => {
						expect(util.exec).toHaveBeenCalledTimes(1);
						expect(util.exec).toHaveBeenCalledWith(
							"git remote add upstream git@github.com:johndoe/noParent-repo.git"
						);
					});
				});

				describe("when using svn_url", () => {
					it("should create remote upstream", () => {
						state.remotes.origin.url =
							"https://github.com/johndoe/noParent-repo.git";
						GitHub.mockImplementation(mockGitHub(true, false));

						return run.verifyUpstream(state).then(() => {
							expect(util.exec).toHaveBeenCalledTimes(1);
							expect(util.exec).toHaveBeenCalledWith(
								"git remote add upstream https://github.com/johndoe/noParent-repo.git"
							);
						});
					});
				});
			});

			it("should create remote upstream with svn_url", () => {
				state.remotes.origin.url =
					"https://github.com/johndoe/noParent-repo.git";

				return run.verifyUpstream(state).then(() => {
					expect(util.exec).toHaveBeenCalledTimes(1);
					expect(util.exec).toHaveBeenCalledWith(
						"git remote add upstream https://github.com/johndoe/noParent-repo.git"
					);
				});
			});
		});
	});

	describe("verifyChangelog", () => {
		beforeEach(() => {
			util.fileExists = jest.fn(() => false);
			util.writeFile = jest.fn(() => {});
			util.prompt = jest.fn(() => Promise.resolve({ changelog: true }));
		});

		describe("when CHANGELOG.md exists", () => {
			it("should log the action to the console", () => {
				util.fileExists = jest.fn(() => true);
				return run.verifyChangelog(state).then(() => {
					expect(util.log.begin).toHaveBeenCalledTimes(1);
					expect(util.log.begin).toHaveBeenCalledWith(
						"Verifying CHANGELOG.md"
					);
					expect(util.log.end).toHaveBeenCalledTimes(1);
				});
			});
		});

		describe("when CHANGELOG.md doesn't exist", () => {
			it("should prompt user", () => {
				return run.verifyChangelog(state).then(() => {
					expect(util.prompt).toHaveBeenCalledTimes(1);
					expect(util.prompt).toHaveBeenCalledWith([
						{
							type: "confirm",
							name: "changelog",
							message:
								"Would you like us to create a CHANGELOG.md?",
							default: true
						}
					]);
				});
			});

			it("should log the action to the console", () => {
				return run.verifyChangelog(state).then(() => {
					expect(util.log.begin).toHaveBeenCalledTimes(2);
					expect(util.log.begin).toHaveBeenCalledWith(
						"Creating CHANGELOG.md"
					);
					expect(util.log.end).toHaveBeenCalledTimes(2);
				});
			});

			it("should create CHANGELOG.md", () => {
				util.prompt = jest.fn(() =>
					Promise.resolve({ changelog: true })
				);
				return run.verifyChangelog(state).then(() => {
					expect(util.writeFile).toHaveBeenCalledTimes(1);
				});
			});

			it("should not create CHANGELOG.md", () => {
				util.prompt = jest.fn(() =>
					Promise.resolve({ changelog: false })
				);
				return run.verifyChangelog(state).then(() => {
					expect(util.writeFile).not.toHaveBeenCalled();
				});
			});
		});
	});

	describe("verifyPackageJson", () => {
		beforeEach(() => {
			state = {
				configPath: "./some_path"
			};
			util.advise = jest.fn(() => Promise.resolve());
			util.fileExists = jest.fn(() => true);
		});

		it("should log the action to the console", () => {
			return run.verifyPackageJson(state).then(() => {
				expect(util.log.begin).toHaveBeenCalledTimes(1);
				expect(util.log.begin).toHaveBeenCalledWith(
					"Verifying package.json"
				);
				expect(util.log.end).toHaveBeenCalledTimes(1);
			});
		});

		describe("when configPath exists", () => {
			it("should not advise", () => {
				return run.verifyPackageJson(state).then(() => {
					expect(util.advise).not.toHaveBeenCalled();
				});
			});
		});

		describe("when configPath doesn't exist", () => {
			it("should advise", () => {
				util.fileExists = jest.fn(() => false);
				return run.verifyPackageJson(state).then(() => {
					expect(util.advise).toHaveBeenCalledTimes(1);
					expect(util.advise).toHaveBeenCalledWith(
						"missingPackageJson"
					);
				});
			});
		});
	});

	describe("isPackagePrivate", () => {
		beforeEach(() => {
			state.configPath = "./package.json";
			util.advise = jest.fn(() => Promise.resolve());
			util.isPackagePrivate = jest.fn(() => true);
		});

		it("should advise when package.json is set to private", () => {
			return run.isPackagePrivate(state).then(() => {
				expect(util.advise).toHaveBeenCalledTimes(1);
				expect(util.advise).toHaveBeenCalledWith("privatePackage");
			});
		});

		it("should resolve when package.json isn't private", () => {
			util.isPackagePrivate = jest.fn(() => false);
			return run.isPackagePrivate(state).then(() => {
				expect(util.advise).toHaveBeenCalledTimes(0);
			});
		});
	});

	describe("checkNewCommits", () => {
		beforeEach(() => {
			state.currentVersion = "1.2.3";
			command.shortLog = jest.fn(() =>
				Promise.resolve("some random commit")
			);
		});

		describe("when checking for new commits", () => {
			it("should set state with returned log", () => {
				return run.checkNewCommits(state).then(() => {
					expect(command.shortLog).toHaveBeenCalledTimes(1);
					expect(command.shortLog).toHaveBeenCalledWith(
						`v${state.currentVersion}`
					);
					expect(state.log).toEqual("some random commit");
				});
			});
		});
	});

	describe("useCurrentOrBaseBranch", () => {
		beforeEach(() => {
			state = {
				log: "some random commit",
				hasDevelopBranch: true
			};
			util.advise = jest.fn(() => Promise.resolve());
		});

		describe("when branch has new commits", () => {
			it("should resolve", () => {
				return run.useCurrentOrBaseBranch(state).then(() => {
					expect(command.checkoutBranch).toHaveBeenCalledTimes(0);
					expect(util.advise).toHaveBeenCalledTimes(0);
				});
			});
		});

		describe("when repository has a develop branch and no new changes", () => {
			it("should checkout develop", () => {
				state.log = "";
				run.useCurrentOrBaseBranch(state);
				expect(command.checkoutBranch).toHaveBeenCalledTimes(1);
				expect(util.advise).toHaveBeenCalledTimes(0);
			});
		});

		describe("when branch has no changes nor a develop branch", () => {
			it("should advise", () => {
				state = {
					log: "",
					hasDevelopBranch: false
				};
				return run.useCurrentOrBaseBranch(state).then(() => {
					expect(command.checkoutBranch).toHaveBeenCalledTimes(0);
					expect(util.advise).toHaveBeenCalledTimes(1);
					expect(util.advise).toHaveBeenCalledWith(
						"qaNoChangeNoDevelop"
					);
				});
			});
		});
	});

	describe("promptKeepBranchOrCreateNew", () => {
		beforeEach(() => {
			state = {
				log: "some random commit",
				branch: "feature-branch"
			};
			command.branchExistsRemote = jest.fn(() => Promise.resolve(true));
			util.prompt = jest.fn(() => Promise.resolve({ keep: true }));
		});

		it("should resolve with no new commits", () => {
			state.log = "";
			return run.promptKeepBranchOrCreateNew(state).then(() => {
				expect(util.prompt).toHaveBeenCalledTimes(0);
			});
		});

		describe("when prompting the user", () => {
			it("should set state when user selects true", () => {
				return run.promptKeepBranchOrCreateNew(state).then(() => {
					expect(util.prompt).toHaveBeenCalledTimes(1);
					expect(state).toHaveProperty("keepBranch");
					expect(state.keepBranch).toEqual(true);
				});
			});

			it("should set state when user selects false", () => {
				util.prompt = jest.fn(() => Promise.resolve({ keep: false }));
				return run.promptKeepBranchOrCreateNew(state).then(() => {
					expect(util.prompt).toHaveBeenCalledTimes(1);
					expect(state).toHaveProperty("keepBranch");
					expect(state.keepBranch).toEqual(false);
				});
			});

			describe("when branch exists upstream", () => {
				beforeEach(() => {
					command.branchExistsRemote = jest.fn(() =>
						Promise.resolve(true)
					);
				});

				it("should merge with upstream branch", () => {
					return run.promptKeepBranchOrCreateNew(state).then(() => {
						expect(
							command.branchExistsRemote
						).toHaveBeenCalledTimes(1);
						expect(command.branchExistsRemote).toHaveBeenCalledWith(
							{
								branch: state.branch,
								remote: "upstream"
							}
						);
						expect(git.merge).toHaveBeenCalledTimes(1);
						expect(git.merge).toHaveBeenCalledWith({
							branch: "feature-branch",
							remote: "upstream",
							failHelpKey: "gitMergeUpstreamBranch"
						});
					});
				});
			});

			describe("when branch doesn't exists upstream", () => {
				beforeEach(() => {
					command.branchExistsRemote = jest.fn(() =>
						Promise.resolve(false)
					);
				});

				it("shouldn't merge with upstream branch", () => {
					return run.promptKeepBranchOrCreateNew(state).then(() => {
						expect(
							command.branchExistsRemote
						).toHaveBeenCalledTimes(1);
						expect(command.branchExistsRemote).toHaveBeenCalledWith(
							{
								branch: state.branch,
								remote: "upstream"
							}
						);
						expect(git.merge).toHaveBeenCalledTimes(0);
					});
				});
			});
		});
	});

	describe("findBranchByTag", () => {
		beforeEach(() => {
			state = {
				promote: "v1.1.1-prerelease.0"
			};

			util.prompt = jest.fn(() =>
				Promise.resolve({ branch: "feature-branch" })
			);

			command.getAllBranchesWithTag = jest.fn(() =>
				Promise.resolve(`
* feature-branch
remotes/upstream/feature-branch
feature-another-branch
feature-last-branch`)
			);
		});

		it("should prompt user selection when multiple branches returned", () => {
			return run.findBranchByTag(state).then(() => {
				expect(util.prompt).toHaveBeenCalledTimes(1);
				expect(state).toHaveProperty("branchToRemove");
				expect(state.branchToRemove).toEqual("feature-branch");
			});
		});

		it("should default to only branch returned", () => {
			command.getAllBranchesWithTag = jest.fn(() =>
				Promise.resolve(`* feature-single-branch`)
			);

			return run.findBranchByTag(state).then(() => {
				expect(util.prompt).toHaveBeenCalledTimes(0);
				expect(state).toHaveProperty("branchToRemove");
				expect(state.branchToRemove).toEqual("feature-single-branch");
			});
		});

		it("should set branchToRemove to undefined when no branches exist with tag", () => {
			command.getAllBranchesWithTag = jest.fn(() => Promise.resolve(``));

			return run.findBranchByTag(state).then(() => {
				expect(util.prompt).toHaveBeenCalledTimes(0);
				expect(state).toHaveProperty("branchToRemove");
				expect(state.branchToRemove).toEqual(undefined);
			});
		});

		it("should handle non matching branches being returned", () => {
			command.getAllBranchesWithTag = jest.fn(() =>
				Promise.resolve(`*     `)
			);

			return run.findBranchByTag(state).then(() => {
				expect(util.prompt).toHaveBeenCalledTimes(0);
				expect(state).toHaveProperty("branchToRemove");
				expect(state.branchToRemove).toEqual(undefined);
			});
		});
	});

	describe("deleteLocalFeatureBranch", () => {
		beforeEach(() => {
			state = {
				branchToRemove: "feature-branch"
			};

			command.deleteBranch = jest.fn(() => Promise.resolve());
			util.advise = jest.fn(() => Promise.resolve());
		});

		it("should delete local branch", () => {
			return run.deleteLocalFeatureBranch(state).then(() => {
				expect(command.deleteBranch).toHaveBeenCalledTimes(1);
			});
		});

		it("should resolve when deleteBranch fails", () => {
			command.deleteBranch = jest.fn(args => {
				return args.onError()();
			});
			return run.deleteLocalFeatureBranch(state).then(() => {
				expect(util.advise).toHaveBeenCalledTimes(0);
			});
		});
	});

	describe("updatePackageLockJson", () => {
		beforeEach(() => {
			state = {
				currentVersion: "12.1.1",
				dependencies: [
					{
						pkg: "over-watch",
						version: "1.1.1"
					},
					{
						pkg: "watch-over",
						version: "2.2.2"
					}
				]
			};

			util.fileExists = jest.fn(() => true);
			util.readJSONFile = jest.fn(() => ({ version: "1.2.3" }));
			util.writeJSONFile = jest.fn(() => {});
		});

		it("should do nothing if package-lock.json doesn't exist", () => {
			util.fileExists = jest.fn(() => false);
			return run.updatePackageLockJson(state).then(() => {
				expect(sequence).toHaveBeenCalledTimes(0);
			});
		});

		describe("dependencies", () => {
			describe("exists", () => {
				it(`should call "sequence" with an array of dependencies`, () => {
					return run.updatePackageLockJson(state).then(() => {
						expect(sequence).toHaveBeenCalledTimes(1);
						expect(sequence).toHaveBeenCalledWith(
							expect.any(Array)
						);
					});
				});
			});

			describe("doesn't exist", () => {
				it(`shouldn't call "sequence"`, () => {
					state.dependencies = undefined;
					return run.updatePackageLockJson(state).then(() => {
						expect(sequence).toHaveBeenCalledTimes(0);
					});
				});
			});
		});

		describe("currentVersion", () => {
			describe("exists", () => {
				it("should read and write file", () => {
					return run.updatePackageLockJson(state).then(() => {
						expect(util.readJSONFile).toHaveBeenCalledTimes(1);
						expect(util.readJSONFile).toHaveBeenCalledWith(
							"package-lock.json"
						);
						expect(util.writeJSONFile).toHaveBeenCalledTimes(1);
						expect(util.writeJSONFile).toHaveBeenCalledWith(
							"package-lock.json",
							{ version: "12.1.1" }
						);
					});
				});
			});

			describe("doesn't exist", () => {
				it("shouldn't read or write file", () => {
					state.currentVersion = undefined;
					return run.updatePackageLockJson(state).then(() => {
						expect(util.readJSONFile).toHaveBeenCalledTimes(0);
						expect(util.writeJSONFile).toHaveBeenCalledTimes(0);
					});
				});
			});
		});
	});

	describe("deleteUpstreamFeatureBranch", () => {
		beforeEach(() => {
			state = {
				branchToRemove: "feature-branch"
			};

			command.deleteBranchUpstream = jest.fn(() => Promise.resolve());

			util.advise = jest.fn(() => Promise.resolve());
		});

		it("should delete local branch", () => {
			return run.deleteUpstreamFeatureBranch(state).then(() => {
				expect(command.deleteBranchUpstream).toHaveBeenCalledTimes(1);
			});
		});

		it("should resolve when deleteBranch fails", () => {
			command.deleteBranchUpstream = jest.fn(args => {
				return args.onError()();
			});
			return run.deleteUpstreamFeatureBranch(state).then(() => {
				expect(util.advise).toHaveBeenCalledTimes(0);
			});
		});
	});

	describe("saveDependencies", () => {
		let joinSpy;

		beforeEach(() => {
			state = {
				dependencies: [
					{
						pkg: "my-slice-project",
						version: "1.1.1-some-identifier.0"
					},
					{
						pkg: "my-other-slice-project",
						version: "8.15.0-some-other-identifier.2"
					}
				],
				changeReason: "random reason"
			};

			util.writeJSONFile = jest.fn(() => {});

			joinSpy = jest
				.spyOn(path, "join")
				.mockImplementation(() => "my_path/");
		});

		afterEach(() => {
			joinSpy.mockRestore();
		});

		it("should call `util.writeJSONFile` with path and content", () => {
			return run.saveDependencies(state).then(() => {
				expect(util.writeJSONFile).toHaveBeenCalledTimes(1);
				expect(util.writeJSONFile).toHaveBeenCalledWith("my_path/", {
					changeReason: "random reason",
					dependencies: [
						{
							pkg: "my-slice-project",
							version: "1.1.1-some-identifier.0"
						},
						{
							pkg: "my-other-slice-project",
							version: "8.15.0-some-other-identifier.2"
						}
					]
				});
			});
		});

		it("should advise when the call to `util.writeJSONFile` fails", () => {
			util.advise = jest.fn(() => Promise.resolve());
			util.writeJSONFile = jest.fn(() => {
				throw new Error("nope");
			});

			return run.saveDependencies(state).then(() => {
				expect(util.writeJSONFile).toHaveBeenCalledTimes(1);
				expect(util.advise).toHaveBeenCalledTimes(1);
				expect(util.advise).toHaveBeenCalledWith("saveDependencies");
			});
		});
	});

	describe("getDependenciesFromFile", () => {
		beforeEach(() => {
			util.readJSONFile = jest.fn(() => ({
				changeReason: "random reason",
				dependencies: [
					{
						pkg: "my-slice-project",
						version: "1.1.1-some-identifier.0"
					},
					{
						pkg: "my-other-slice-project",
						version: "8.15.0-some-other-identifier.2"
					}
				]
			}));
		});

		it(`should use dependencies read from ".dependencies.json"`, () => {
			return run.getDependenciesFromFile(state).then(() => {
				expect(state).toHaveProperty("dependencies");
				expect(state.dependencies).toEqual([
					{
						pkg: "my-slice-project",
						version: "1.1.1-some-identifier.0"
					},
					{
						pkg: "my-other-slice-project",
						version: "8.15.0-some-other-identifier.2"
					}
				]);
			});
		});

		it(`should use changeReason read from ".dependencies.json"`, () => {
			return run.getDependenciesFromFile(state).then(() => {
				expect(state).toHaveProperty("changeReason");
				expect(state.changeReason).toEqual("random reason");
			});
		});

		it(`should use {} when no dependencies/changeReason read from ".dependencies.json"`, () => {
			util.readJSONFile = jest.fn(() => ({}));
			return run.getDependenciesFromFile(state).then(() => {
				expect(state).toEqual({
					step: "getDependenciesFromFile"
				});
			});
		});

		it("shouldn't set state when nothing read from file", () => {
			util.readJSONFile = jest.fn(() => undefined);
			state = {
				dependencies: [],
				changeReason: "not set to null"
			};
			return run.getDependenciesFromFile(state).then(() => {
				expect(state).toHaveProperty("dependencies");
				expect(state).toHaveProperty("changeReason");
				expect(state.dependencies).toEqual([]);
				expect(state.changeReason).toEqual("not set to null");
			});
		});
	});

	describe("npmInstallPackage", () => {
		let dep;
		beforeEach(() => {
			util.exec = jest.fn(() => Promise.resolve());
			util.advise = jest.fn(() => Promise.resolve());
			dep = "@lk/my-package@1.1.1";
		});

		it("should execute install successfully", () => {
			return run
				.npmInstallPackage(dep)()
				.then(() => {
					expect(util.log.begin).toHaveBeenCalledTimes(1);
					expect(util.log.begin).toHaveBeenCalledWith(
						`npm install ${dep} -E`
					);
					expect(util.exec).toHaveBeenCalledTimes(1);
					expect(util.exec).toHaveBeenCalledWith(
						`npm install ${dep} -E`
					);
					expect(util.log.end).toHaveBeenCalledTimes(1);
					expect(util.advise).toHaveBeenCalledTimes(0);
				});
		});

		it("should advise when install fails", () => {
			util.exec = jest.fn(() => Promise.reject());
			return run
				.npmInstallPackage(dep)()
				.then(() => {
					expect(util.log.begin).toHaveBeenCalledTimes(1);
					expect(util.log.begin).toHaveBeenCalledWith(
						`npm install ${dep} -E`
					);
					expect(util.exec).toHaveBeenCalledTimes(1);
					expect(util.exec).toHaveBeenCalledWith(
						`npm install ${dep} -E`
					);
					expect(util.log.end).toHaveBeenCalledTimes(1);
					expect(util.advise).toHaveBeenCalledTimes(1);
					expect(util.advise).toHaveBeenCalledWith("npmInstall", {
						exit: false
					});
				});
		});
	});

	describe("gitCreateBranchUpstream", () => {
		beforeEach(() => {
			state = {
				branch: "feature-branch"
			};

			command.branchExistsRemote = jest.fn(() => Promise.resolve(false));
			command.createRemoteBranch = jest.fn(() => Promise.resolve());
		});

		describe("when branch doesn't exist", () => {
			it(`should call "createBranchUpstream" with appropriate args when repo has develop branch`, () => {
				state.hasDevelopBranch = true;
				return run.gitCreateBranchUpstream(state).then(() => {
					expect(command.branchExistsRemote).toHaveBeenCalledTimes(1);
					expect(command.branchExistsRemote).toHaveBeenCalledWith({
						branch: "feature-branch",
						remote: "upstream"
					});
					expect(command.createRemoteBranch).toHaveBeenCalledTimes(1);
					expect(command.createRemoteBranch).toHaveBeenCalledWith({
						branch: "feature-branch",
						remote: "upstream",
						base: "develop"
					});
				});
			});

			it(`should call "createBranchUpstream" with appropriate args when repo doesn't have develop branch`, () => {
				return run.gitCreateBranchUpstream(state).then(() => {
					expect(command.branchExistsRemote).toHaveBeenCalledTimes(1);
					expect(command.branchExistsRemote).toHaveBeenCalledWith({
						branch: "feature-branch",
						remote: "upstream"
					});
					expect(command.createRemoteBranch).toHaveBeenCalledTimes(1);
					expect(command.createRemoteBranch).toHaveBeenCalledWith({
						branch: "feature-branch",
						remote: "upstream",
						base: "master"
					});
				});
			});
		});

		describe("when devBranch provided", () => {
			beforeEach(() => {
				state.devBranch = "master";
			});

			it(`should call "createBranchUpstream" with appropriate args when repo has develop branch`, () => {
				state.hasDevelopBranch = true;
				return run.gitCreateBranchUpstream(state).then(() => {
					expect(command.branchExistsRemote).toHaveBeenCalledTimes(1);
					expect(command.branchExistsRemote).toHaveBeenCalledWith({
						branch: "master",
						remote: "upstream"
					});
					expect(command.createRemoteBranch).toHaveBeenCalledTimes(1);
					expect(command.createRemoteBranch).toHaveBeenCalledWith({
						branch: "master",
						remote: "upstream",
						base: "develop"
					});
				});
			});

			it(`should call "createBranchUpstream" with appropriate args when repo doesn't have develop branch`, () => {
				return run.gitCreateBranchUpstream(state).then(() => {
					expect(command.branchExistsRemote).toHaveBeenCalledTimes(1);
					expect(command.branchExistsRemote).toHaveBeenCalledWith({
						branch: "master",
						remote: "upstream"
					});
					expect(command.createRemoteBranch).toHaveBeenCalledTimes(1);
					expect(command.createRemoteBranch).toHaveBeenCalledWith({
						branch: "master",
						remote: "upstream",
						base: "master"
					});
				});
			});
		});

		it(`shouldn't call "createBranchUpstream" when branch exist`, () => {
			command.branchExistsRemote = jest.fn(() => Promise.resolve(true));
			return run.gitCreateBranchUpstream(state).then(() => {
				expect(command.branchExistsRemote).toHaveBeenCalledTimes(1);
				expect(command.branchExistsRemote).toHaveBeenCalledWith({
					branch: "feature-branch",
					remote: "upstream"
				});
				expect(command.createRemoteBranch).toHaveBeenCalledTimes(0);
			});
		});
	});

	describe("gitCreateBranchOrigin", () => {
		beforeEach(() => {
			state = {
				branch: "feature-branch"
			};

			command.branchExistsRemote = jest.fn(() => Promise.resolve(false));
			command.createRemoteBranch = jest.fn(() => Promise.resolve());
		});

		it(`should call "createBranchOrigin" when branch doesn't exist`, () => {
			return run.gitCreateBranchOrigin(state).then(() => {
				expect(command.branchExistsRemote).toHaveBeenCalledTimes(1);
				expect(command.branchExistsRemote).toHaveBeenCalledWith({
					branch: "feature-branch",
					remote: "origin"
				});
				expect(command.createRemoteBranch).toHaveBeenCalledTimes(1);
				expect(command.createRemoteBranch).toHaveBeenCalledWith({
					branch: "feature-branch",
					remote: "origin",
					base: "feature-branch"
				});
			});
		});

		describe("when branch exists", () => {
			beforeEach(() => {
				command.branchExistsRemote = jest.fn(() =>
					Promise.resolve(true)
				);
				command.pushRemoteBranch = jest.fn(() => Promise.resolve());
				util.advise = jest.fn(() => Promise.resolve());
			});

			it(`should call "pushRemoteBranch"`, () => {
				return run.gitCreateBranchOrigin(state).then(() => {
					expect(command.branchExistsRemote).toHaveBeenCalledTimes(1);
					expect(command.branchExistsRemote).toHaveBeenCalledWith({
						branch: "feature-branch",
						remote: "origin"
					});
					expect(command.pushRemoteBranch).toHaveBeenCalledTimes(1);
				});
			});

			it("should advise when push fails", () => {
				command.pushRemoteBranch = jest.fn(args => {
					return args.onError()();
				});
				return run.gitCreateBranchOrigin(state).then(() => {
					expect(command.pushRemoteBranch).toHaveBeenCalledTimes(1);
					expect(util.advise).toHaveBeenCalledTimes(1);
					expect(util.advise).toHaveBeenCalledWith(
						"remoteBranchOutOfDate",
						{ exit: false }
					);
				});
			});
		});
	});

	describe("updatePullRequestTitle", () => {
		let prTitle;
		beforeEach(() => {
			prTitle = "This is my test title.";
			command.getLastCommitText = jest.fn(() => Promise.resolve(prTitle));

			util.prompt = jest.fn(() => Promise.resolve({ title: prTitle }));
		});

		it("should prompt the user for a pull request title", () => {
			return run.updatePullRequestTitle(state).then(() => {
				expect(util.prompt).toHaveBeenCalledTimes(1);
				expect(util.prompt).toHaveBeenCalledWith([
					{
						type: "input",
						name: "title",
						message: "What is the title of your pull request?",
						default: prTitle
					}
				]);
			});
		});

		it("should persist the given title to the workflow state", () => {
			return run.updatePullRequestTitle(state).then(() => {
				expect(state.pullRequest).toHaveProperty("title");
				expect(state.pullRequest.title).toEqual(prTitle);
			});
		});
	});

	describe("updatePullRequestBody", () => {
		beforeEach(() => {
			util.prompt = jest.fn(() => Promise.resolve({ body: true }));
			util.editFile = jest.fn(() =>
				Promise.resolve(" an updated pull request body ")
			);
		});

		it("should prompt asking the user if they wish to edit the body", () => {
			return run.updatePullRequestBody(state).then(() => {
				expect(util.prompt).toHaveBeenCalledTimes(1);
				expect(util.prompt).toHaveBeenCalledWith([
					{
						type: "confirm",
						name: "body",
						message:
							"Would you like to edit the body of your pull request?",
						default: true
					}
				]);
			});
		});

		describe("when the user chooses to edit the body", () => {
			describe("when the template file exists", () => {
				beforeEach(() => {
					util.fileExists = jest.fn(() => true);
					util.readFile = jest.fn(
						() => "this is my template contents"
					);
				});

				it("should launch the user's editor", () => {
					return run.updatePullRequestBody(state).then(() => {
						expect(util.editFile).toHaveBeenCalledTimes(1);
						expect(util.editFile).toHaveBeenCalledWith(
							"this is my template contents"
						);
					});
				});

				it("should trim the data from the editor, and persist the result to state", () => {
					return run.updatePullRequestBody(state).then(() => {
						expect(state.pullRequest).toHaveProperty("body");
						expect(state.pullRequest.body).toEqual(
							"an updated pull request body"
						);
					});
				});

				it("should log the action to the console", () => {
					return run.updatePullRequestBody(state).then(() => {
						expect(util.log.begin).toHaveBeenCalledTimes(1);
						expect(util.log.begin).toHaveBeenCalledWith(
							"pull request body preview"
						);
						expect(util.log.end).toHaveBeenCalledTimes(1);
					});
				});
			});

			describe("when the template file doesn't exists", () => {
				beforeEach(() => {
					util.fileExists = jest.fn(() => false);
				});

				it("should launch the user's editor", () => {
					return run.updatePullRequestBody(state).then(() => {
						expect(util.editFile).toHaveBeenCalledTimes(1);
						expect(util.editFile).toHaveBeenCalledWith("");
					});
				});
			});
		});

		describe("when the user declines to edit the body", () => {
			it("should not launch the user's editor", () => {
				util.prompt = jest.fn(() => Promise.resolve({ body: false }));
				return run.updatePullRequestBody(state).then(() => {
					expect(util.editFile).not.toHaveBeenCalled();
				});
			});
		});
	});

	describe("checkoutBaseBranch", () => {
		describe("hasDevelopBranch", () => {
			it("should call checkoutDevelop when true", () => {
				state.hasDevelopBranch = true;
				run.checkoutBaseBranch(state);
				expect(command.checkoutBranch).toHaveBeenCalledTimes(1);
				expect(state.branch).toBe("develop");
			});

			it("should call checkoutMaster when false", () => {
				state.hasDevelopBranch = false;
				run.checkoutBaseBranch(state);
				expect(command.checkoutBranch).toHaveBeenCalledTimes(1);
				expect(state.branch).toBe("master");
			});
		});
	});

	describe("rebaseUpstreamBaseBranch", () => {
		beforeEach(() => {
			command.rebaseUpstreamDevelop = jest.fn(() => Promise.resolve());
			command.rebaseUpstreamMaster = jest.fn(() => Promise.resolve());
		});

		describe("hasDevelopBranch", () => {
			it("should call checkoutDevelop when true", () => {
				state.hasDevelopBranch = true;
				return run.rebaseUpstreamBaseBranch(state).then(() => {
					expect(command.rebaseUpstreamDevelop).toHaveBeenCalledTimes(
						1
					);
				});
			});

			it("should call checkoutMaster when false", () => {
				state.hasDevelopBranch = false;
				return run.rebaseUpstreamBaseBranch(state).then(() => {
					expect(command.rebaseUpstreamMaster).toHaveBeenCalledTimes(
						1
					);
				});
			});
		});
	});

	describe("changeDirectory", () => {
		let processSpy;
		beforeEach(() => {
			processSpy = jest
				.spyOn(process, "chdir")
				.mockImplementation(() => {});
		});

		it("should change directory", () => {
			state.cwd = "/my/new/dir";
			run.changeDirectory(state).then(() => {
				expect(processSpy).toHaveBeenCalledTimes(1);
				expect(processSpy).toHaveBeenCalledWith("/my/new/dir");
			});
		});

		describe("when handling error", () => {
			beforeEach(() => {
				processSpy = jest
					.spyOn(process, "chdir")
					.mockImplementation(() => {
						throw new Error();
					});
			});

			it("should handle error", () => {
				state.cwd = "/crazy/unknown/dir";
				return run.changeDirectory(state).catch(error => {
					expect(error).toEqual(
						"Unable to cwd to provided: /crazy/unknown/dir"
					);
				});
			});
		});

		afterEach(() => {
			processSpy.mockRestore();
		});
	});

	describe("createOrCheckoutBranch", () => {
		beforeEach(() => {
			command.branchExists = jest.fn(() => Promise.resolve(true));
			command.checkoutBranch = jest.fn(() => Promise.resolve());
			state.branch = "feature-branch";
			git.checkout = jest.fn(() => Promise.resolve());
		});

		it("should set step on state", () => {
			run.createOrCheckoutBranch(state).then(() => {
				expect(state).toHaveProperty("step");
				expect(state.step).toEqual("createOrCheckoutBranch");
			});
		});

		describe("branch exists locally", () => {
			it("should call checkoutBranch", () => {
				run.createOrCheckoutBranch(state).then(() => {
					expect(command.checkoutBranch).toHaveBeenCalledTimes(1);
					expect(command.checkoutBranch).toHaveBeenCalledWith({
						branch: "feature-branch"
					});
				});
			});
		});

		describe("branch doesn't exist locally", () => {
			describe("branch exists on remote", () => {
				it("should call git.checkout", () => {
					command.branchExists = jest.fn(() =>
						Promise.resolve(false)
					);
					command.branchExistsRemote = jest.fn(() =>
						Promise.resolve(true)
					);
					run.createOrCheckoutBranch(state).then(() => {
						expect(git.checkout).toHaveBeenCalledTimes(1);
						expect(git.checkout).toHaveBeenCalledWith({
							branch: "feature-branch",
							option: "-b",
							tracking: "feature-branch"
						});
					});
				});
			});

			describe("branch doesn't exist on remote", () => {
				it("should call checkoutBranch", () => {
					command.branchExists = jest.fn(() =>
						Promise.resolve(false)
					);
					command.branchExistsRemote = jest.fn(() =>
						Promise.resolve(false)
					);
					run.createOrCheckoutBranch(state).then(() => {
						expect(command.checkoutBranch).toHaveBeenCalledTimes(1);
						expect(command.checkoutBranch).toHaveBeenCalledWith({
							branch: "feature-branch"
						});
					});
				});
			});
		});
	});

	describe("diffWithUpstreamMaster", () => {
		beforeEach(() => {
			git.diff = jest.fn(() => Promise.resolve(false));
			state.hasChanges = false;
		});

		it("should set step on state", async () => {
			await run.diffWithUpstreamMaster(state);
			expect(state).toHaveProperty("step");
			expect(state.step).toEqual("diffWithUpstreamMaster");
		});

		it("should call git.diff", async () => {
			await run.diffWithUpstreamMaster(state);
			expect(git.diff).toHaveBeenCalledTimes(1);
			expect(git.diff).toHaveBeenCalledWith({
				option: "--word-diff",
				branch: "master",
				glob: "*.yaml",
				maxBuffer: undefined
			});
		});

		it("shouldn't set hasChanges on state", async () => {
			await run.diffWithUpstreamMaster(state);
			expect(state).toHaveProperty("hasChanges");
			expect(state.hasChanges).toEqual(false);
		});

		describe("when setting changes", () => {
			beforeEach(() => {
				git.diff = jest.fn(() =>
					Promise.resolve(`diff --git a/src/components/Filter/Filter.i18n.yaml b/src/components/Filter/Filter.i18n.yaml
index 8e8e57a..545983d 100644
--- a/src/components/Filter/Filter.i18n.yaml
+++ b/src/components/Filter/Filter.i18n.yaml
@@ -48,9 +48,8 @@ common.filter.savedFilters.label: Saved Filters
common.filter.savedFilters.saveOptions.save: Save {+Me+}
common.filter.savedFilters.saveOptions.saveAs: Save As…
common.filter.savedFilters.saveOptions.newSaved: New Saved Filter
common.filter.savedFilters.saveOptions.rename: [-Rename and Sharing…-]{+Rename…+}
common.filter.savedFilters.saveOptions.delete: Delete
common.filter.savedFilters.saveOptions.rename: {+Rename…+}[-Rename and Sharing…-]
common.filter.savedFilters.saveOptions.discard: Discard Changes
common.filter.savedFilters.more: More Actions
common.filter.savedFilters.new: "<New>"
[-common.filter.savedFilters.sharedHeader: Shared Filters-]
`)
				);
			});

			it("should handle additions", async () => {
				await run.diffWithUpstreamMaster(state);
				expect(state.changes).toHaveProperty("locale");
				expect(state.changes.locale).toEqual(true);
			});

			it("should handle deletions", async () => {
				await run.diffWithUpstreamMaster(state);
				expect(state.changes).toHaveProperty("dev");
				expect(state.changes.dev).toEqual(true);
			});
		});
	});

	describe("checkoutl10nBranch", () => {
		beforeEach(() => {
			command.branchExists = jest.fn(() => Promise.resolve(true));
			command.checkoutAndCreateBranch = jest.fn(() => Promise.resolve());
			command.checkoutBranch = jest.fn(() => Promise.resolve());

			global.Date = jest.fn(() => ({
				toLocaleString: () => "Feb",
				getDate: () => "15"
			}));
		});

		it("should set step on state", () => {
			run.checkoutl10nBranch(state).then(() => {
				expect(state).toHaveProperty("step");
				expect(state.step).toEqual("checkoutl10nBranch");
			});
		});

		describe("branch exists", () => {
			it("should call command.checkoutBranch", () => {
				run.checkoutl10nBranch(state).then(() => {
					expect(command.checkoutBranch).toHaveBeenCalledTimes(1);
					expect(command.checkoutBranch).toHaveBeenCalledWith({
						branch: "feature-localization-feb-15"
					});
				});
			});

			it("should set status on state", () => {
				run.checkoutl10nBranch(state).then(() => {
					expect(state).toHaveProperty("status");
					expect(state.status).toEqual("skipped");
				});
			});
		});

		describe("branch doesn't exist", () => {
			it("should call command.checkoutAndCreateBranch", () => {
				command.branchExists = jest.fn(() => Promise.resolve(false));
				run.checkoutl10nBranch(state).then(() => {
					expect(
						command.checkoutAndCreateBranch
					).toHaveBeenCalledTimes(1);
					expect(
						command.checkoutAndCreateBranch
					).toHaveBeenCalledWith({
						branch: "feature-localization-feb-15"
					});
				});
			});
		});
	});

	describe("commitDiffWithUpstreamMaster", () => {
		beforeEach(() => {
			git.log = jest.fn(() => Promise.resolve(""));
			state.branch = "feature-branch";
			state.changes = {
				diff: 0
			};
		});

		it("should set step on state", () => {
			run.commitDiffWithUpstreamMaster(state).then(() => {
				expect(state).toHaveProperty("step");
				expect(state.step).toEqual("commitDiffWithUpstreamMaster");
			});
		});

		it("should call git.log with appropriate args", () => {
			run.commitDiffWithUpstreamMaster(state).then(() => {
				expect(git.log).toHaveBeenCalledTimes(1);
				expect(git.log).toHaveBeenCalledWith({
					option: "--no-merges --oneline",
					branch: "feature-branch",
					remote: "upstream/master"
				});
			});
		});

		describe("diff", () => {
			describe("exists", () => {
				it("should set diff on state when commits exist", async () => {
					git.log = jest.fn(() => Promise.resolve("some commit"));
					await run.commitDiffWithUpstreamMaster(state);
					expect(state.changes).toHaveProperty("diff");
					expect(state.changes.diff).toEqual(1);
				});
			});

			describe("doesn't exist", () => {
				it("should set diff on state when commits exist", async () => {
					git.log = jest.fn(() => Promise.resolve(""));
					await run.commitDiffWithUpstreamMaster(state);
					expect(state.changes).toHaveProperty("diff");
					expect(state.changes.diff).toEqual(0);
				});
			});
		});
	});
});
