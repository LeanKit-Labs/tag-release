jest.mock("chalk", () => ({
	yellow: {
		bold: jest.fn(arg => arg)
	},
	white: {
		bold: jest.fn(arg => arg)
	}
}));

import chalk from "chalk"; // eslint-disable-line no-unused-vars
import logger from "better-console";
import util from "../../../src/utils";
import command from "../../../src/command";
import git from "../../../src/git";
import * as run from "../../../src/workflows/steps/conflictResolution";

describe("conflict resolution workflow steps", () => {
	let state = {};
	beforeEach(() => {
		state = {
			filePaths: {
				rootPath: "/some/root/path",
				configPath: "/some/root/path/package.json",
				changeLogPath: "/some/root/path/CHANGELOG.md",
				packageLockJsonPath: "/some/root/path/package-lock.json",
				gitIgnorePath: "/some/root/path/.gitignore",
				pullRequestTemplatePath:
					"/some/root/path/.github/PULL_REQUEST_TEMPLATE.md"
			}
		};
		logger.log = jest.fn(arg => arg);
		util.writeFile = jest.fn(arg => arg);
		util.readFile = jest.fn(
			() =>
				`{
	"devDependencies": {
		"@banditsoftware/some-package": "2.5.0",
	<<<<<<< HEAD
		"@banditsoftware/my-package": "14.14.0",
		"@banditsoftware/my-other-package": "2.0.0",
	=======
		"@banditsoftware/my-package": "14.14.2-filterror.0",
		"@banditsoftware/my-other-package": "1.0.0",
	>>>>>>> f07c714... Bumped my-package to 14.14.2-filterror.0: conflicting change
		"@banditsoftware/some-other-package": "1.3.0",
	}
}`
		);
		util.advise = jest.fn(() => Promise.resolve());
	});

	describe("gitRebaseUpstreamBaseWithConflictFlag", () => {
		beforeEach(() => {
			state = Object.assign(
				{
					hasDevelopBranch: true
				},
				state
			);
		});

		it(`should call "command.rebaseUpstreamDevelop"`, () => {
			command.rebaseUpstreamDevelop = jest.fn(() =>
				Promise.resolve({ conflict: false })
			);
			return run.gitRebaseUpstreamBaseWithConflictFlag(state).then(() => {
				expect(command.rebaseUpstreamDevelop).toHaveBeenCalledTimes(1);
				expect(state.conflict).toEqual(false);
			});
		});

		it(`should call "command.rebaseUpstreamDefaultBranch"`, () => {
			state.hasDevelopBranch = false;
			command.rebaseUpstreamDefaultBranch = jest.fn(() =>
				Promise.resolve({ conflict: false })
			);
			return run.gitRebaseUpstreamBaseWithConflictFlag(state).then(() => {
				expect(
					command.rebaseUpstreamDefaultBranch
				).toHaveBeenCalledTimes(1);
				expect(state.conflict).toEqual(false);
			});
		});

		it("onError should resolve to true when conflict is in package.json", () => {
			command.rebaseUpstreamDevelop = jest.fn(({ onError }) => {
				return onError("error")();
			});
			git.status = jest.fn(() => Promise.resolve("package.json"));
			return run.gitRebaseUpstreamBaseWithConflictFlag(state).then(() => {
				expect(command.rebaseUpstreamDevelop).toHaveBeenCalledTimes(1);
				expect(state.conflict).toEqual(true);
			});
		});

		it("onError should reject with false when there isn't a conflict in package.json", () => {
			command.rebaseUpstreamDevelop = jest.fn(({ onError }) => {
				return onError("error")();
			});
			git.status = jest.fn(() =>
				Promise.resolve("just some random string")
			);
			return run
				.gitRebaseUpstreamBaseWithConflictFlag(state)
				.catch(() => {
					expect(command.rebaseUpstreamDevelop).toHaveBeenCalledTimes(
						1
					);
					expect(util.advise).toHaveBeenCalledTimes(1);
					expect(util.advise).toHaveBeenCalledWith(
						"gitRebaseUpstreamBase"
					);
					expect(state.conflict).toEqual(undefined);
				});
		});
	});

	describe("verifyConflictResolution", () => {
		it("should call `command.checkConflictMarkers`", () => {
			command.checkConflictMarkers = jest.fn(() => Promise.resolve());
			return run.verifyConflictResolution().then(() => {
				expect(command.checkConflictMarkers).toHaveBeenCalledTimes(1);
			});
		});
	});

	describe("getLocalChanges", () => {
		it("should set state with localChanges", () => {
			state = Object.assign(
				{
					dependencies: [
						{
							pkg: "my-perfect-package",
							version: "1.1.1-something.3"
						},
						{
							pkg: "my-worst-package",
							version: "2.4.1-overwatch.1"
						}
					],
					cr: {}
				},
				state
			);
			run.getLocalChanges(state);
			expect(state.cr).toHaveProperty("localChanges");
			expect(state.cr.localChanges).toEqual({
				"my-perfect-package": "1.1.1-something.3",
				"my-worst-package": "2.4.1-overwatch.1"
			});
		});
	});

	describe("findConflictedPackageJSONChunks", () => {
		it("should set state with conflicts", () => {
			state = Object.assign(
				{
					scope: "@banditsoftware",
					cr: {
						localChanges: {
							"my-package": "14.14.2-filterror.0"
						}
					}
				},
				state
			);

			run.findConflictedPackageJSONChunks(state);
			expect(state.cr).toHaveProperty("chunks");
			expect(state.cr).toHaveProperty("newLines");
			expect(state.cr).toHaveProperty("contents");
			expect(state.cr.chunks).toEqual({
				'		"@banditsoftware/some-package": "2.5.0",': [
					'		"@banditsoftware/my-package": "14.14.0",',
					'		"@banditsoftware/my-other-package": "2.0.0",'
				]
			});
			expect(state.cr.newLines).toEqual([
				"{",
				'	"devDependencies": {',
				'		"@banditsoftware/some-package": "2.5.0",',
				'		"@banditsoftware/some-other-package": "1.3.0",',
				"	}",
				"}"
			]);
			expect(state.cr.contents).toEqual(`{
	"devDependencies": {
		"@banditsoftware/some-package": "2.5.0",
	<<<<<<< HEAD
		"@banditsoftware/my-package": "14.14.0",
		"@banditsoftware/my-other-package": "2.0.0",
	=======
		"@banditsoftware/my-package": "14.14.2-filterror.0",
		"@banditsoftware/my-other-package": "1.0.0",
	>>>>>>> f07c714... Bumped my-package to 14.14.2-filterror.0: conflicting change
		"@banditsoftware/some-other-package": "1.3.0",
	}
}`);
			expect(state.cr.localChanges).toEqual({
				"my-package": "14.14.2-filterror.0",
				"my-other-package": "1.0.0"
			});
		});

		it("should use undefined in localChanges for change when change isn't in localChanges and package doesn't match regex", () => {
			state = Object.assign(
				{
					cr: {
						localChanges: {
							"my-package": "14.14.2-filterror.0"
						}
					}
				},
				state
			);

			util.readFile = jest.fn(
				() =>
					`{
	"devDependencies": {
		"@banditsoftware/some-package": "2.5.0",
	<<<<<<< HEAD
		"@banditsoftware/my-package": "14.14.0",
		"@banditsoftware/my-other-package": "2.0.0",
	=======
		"@banditsoftware/my-package": "14.14.2-filterror.0",
		"@banditsoftware/my-other-package": "blahblahblah",
	>>>>>>> f07c714... Bumped my-package to 14.14.2-filterror.0: conflicting change
		"@banditsoftware/some-other-package": "1.3.0",
	}
}`
			);

			run.findConflictedPackageJSONChunks(state);
			expect(state.cr).toHaveProperty("chunks");
			expect(state.cr).toHaveProperty("newLines");
			expect(state.cr).toHaveProperty("contents");
			expect(state.cr.chunks).toEqual({
				'		"@banditsoftware/some-package": "2.5.0",': [
					'		"@banditsoftware/my-package": "14.14.0",',
					'		"@banditsoftware/my-other-package": "2.0.0",'
				]
			});
			expect(state.cr.newLines).toEqual([
				"{",
				'	"devDependencies": {',
				'		"@banditsoftware/some-package": "2.5.0",',
				'		"@banditsoftware/some-other-package": "1.3.0",',
				"	}",
				"}"
			]);
			expect(state.cr.contents).toEqual(`{
	"devDependencies": {
		"@banditsoftware/some-package": "2.5.0",
	<<<<<<< HEAD
		"@banditsoftware/my-package": "14.14.0",
		"@banditsoftware/my-other-package": "2.0.0",
	=======
		"@banditsoftware/my-package": "14.14.2-filterror.0",
		"@banditsoftware/my-other-package": "blahblahblah",
	>>>>>>> f07c714... Bumped my-package to 14.14.2-filterror.0: conflicting change
		"@banditsoftware/some-other-package": "1.3.0",
	}
}`);
			expect(state.cr.localChanges).toEqual({
				"my-package": "14.14.2-filterror.0",
				undefined
			});
		});
	});

	describe("resolveChunkConflicts", () => {
		it("should update chunks with localChanges if locally changed packages are the ones in conflict", () => {
			state = Object.assign(
				{
					scope: "@banditsoftware",
					cr: {
						chunks: {
							'		"@banditsoftware/some-package": "2.5.0",': [
								'		"@banditsoftware/my-perfect-package": "1.2.0",'
							]
						},
						localChanges: {
							"my-perfect-package": "1.1.1-something.3"
						}
					}
				},
				state
			);

			run.resolveChunkConflicts(state);
			expect(state.cr).toHaveProperty("chunks");
			expect(state.cr.chunks).toEqual({
				'		"@banditsoftware/some-package": "2.5.0",': [
					'		"@banditsoftware/my-perfect-package": "1.1.1-something.3",'
				]
			});
		});

		it("should use HEAD changes with conflicted package in chunk isn't a pre-release", () => {
			state = Object.assign(
				{
					scope: "@banditsoftware",
					cr: {
						chunks: {
							'		"@banditsoftware/some-package": "2.5.0",': [
								'		"@banditsoftware/my-package": "11.2.0",'
							]
						},
						localChanges: {
							"my-perfect-package": "1.1.1-something.3",
							"my-package": "11.2.0",
							"some-random-package": "11.2.0"
						}
					}
				},
				state
			);

			run.resolveChunkConflicts(state);
			expect(state.cr).toHaveProperty("chunks");
			expect(state.cr.chunks).toEqual({
				'		"@banditsoftware/some-package": "2.5.0",': [
					'		"@banditsoftware/my-package": "11.2.0",'
				]
			});
			expect(logger.log).toHaveBeenCalledTimes(1);
			expect(logger.log).toHaveBeenCalledWith(
				"You had a local change of 11.2.0 for my-package, but we used HEAD's version of 11.2.0"
			);
		});

		it("should do nothing for with localChanges that aren't in conflicted chunks", () => {
			state = Object.assign(
				{
					scope: "@banditsoftware",
					cr: {
						chunks: {
							'		"@banditsoftware/some-package": "2.5.0",': [
								'		"@banditsoftware/my-package": "11.2.0",'
							]
						},
						localChanges: {
							"my-package": "11.2.0",
							"some-random-package": "1.0.0"
						}
					}
				},
				state
			);

			run.resolveChunkConflicts(state);
			expect(state.cr).toHaveProperty("chunks");
			expect(state.cr.chunks).toEqual({
				'		"@banditsoftware/some-package": "2.5.0",': [
					'		"@banditsoftware/my-package": "11.2.0",'
				]
			});
		});

		it("should use undefined when version doesn't match regex in conflict chunk", () => {
			state = Object.assign(
				{
					scope: "@banditsoftware",
					cr: {
						chunks: {
							'		"@banditsoftware/some-package": "2.5.0",': [
								'		"@banditsoftware/my-package": "this shouldn\'t match",'
							]
						},
						localChanges: {
							"my-package": "11.2.0"
						}
					}
				},
				state
			);

			run.resolveChunkConflicts(state);
			expect(state.cr).toHaveProperty("chunks");
			expect(state.cr.chunks).toEqual({
				'		"@banditsoftware/some-package": "2.5.0",': [
					'		"@banditsoftware/my-package": "this shouldn\'t match",'
				]
			});
			expect(logger.log).toHaveBeenCalledTimes(1);
			expect(logger.log).toHaveBeenCalledWith(
				"You had a local change of 11.2.0 for my-package, but we used HEAD's version of undefined"
			);
		});
	});

	describe("writeChunksToPackageJSON", () => {
		it("should call util.writeFile with appropriate args", () => {
			state = Object.assign(
				{
					cr: {
						contents: `{
						"devDependencies": {
							"@banditsoftware/some-package": "2.5.0",
						<<<<<<< HEAD
							"@banditsoftware/my-package": "14.14.0",
						=======
							"@banditsoftware/my-package": "14.14.2-filterror.0",
						>>>>>>> f07c714... Bumped my-package to 14.14.2-filterror.0: conflicting change
							"@banditsoftware/some-other-package": "1.3.0",
						}
					}`,
						chunks: {
							'		"@banditsoftware/some-package": "2.5.0",': [
								'		"@banditsoftware/my-package": "14.14.2-filterror.0",'
							]
						},
						newLines: [
							"{",
							'	"devDependencies": {',
							'		"@banditsoftware/some-package": "2.5.0",',
							'		"@banditsoftware/some-other-package": "1.3.0",',
							"	}",
							"}"
						]
					}
				},
				state
			);
			run.writeChunksToPackageJSON(state);
			expect(util.writeFile).toHaveBeenCalledTimes(1);
			expect(util.writeFile).toHaveBeenCalledWith(
				"/some/root/path/package.json",
				`{
	"devDependencies": {
		"@banditsoftware/some-package": "2.5.0",
		"@banditsoftware/my-package": "14.14.2-filterror.0",
		"@banditsoftware/some-other-package": "1.3.0",
	}
}`
			);
		});
	});

	describe("resolvePackageJSONConflicts", () => {
		it("should write to package.json with corrected conflicted chunks and set state accordingly if conflict is true", () => {
			state = Object.assign(
				{
					scope: "@banditsoftware",
					conflict: true,
					dependencies: [
						{
							pkg: "my-package",
							version: "14.14.2-filterror.0"
						}
					]
				},
				state
			);

			run.resolvePackageJSONConflicts(state);
			expect(state.cr).toHaveProperty("chunks");
			expect(state.cr).toHaveProperty("newLines");
			expect(state.cr).toHaveProperty("contents");
			expect(state.cr.chunks).toEqual({
				'		"@banditsoftware/some-package": "2.5.0",': [
					'		"@banditsoftware/my-package": "14.14.2-filterror.0",',
					'		"@banditsoftware/my-other-package": "2.0.0",'
				]
			});
			expect(state.cr.newLines).toEqual([
				"{",
				'	"devDependencies": {',
				'		"@banditsoftware/some-package": "2.5.0",',
				'		"@banditsoftware/my-package": "14.14.2-filterror.0",',
				'		"@banditsoftware/my-other-package": "2.0.0",',
				'		"@banditsoftware/some-other-package": "1.3.0",',
				"	}",
				"}"
			]);
			expect(state.cr.contents).toEqual(`{
	"devDependencies": {
		"@banditsoftware/some-package": "2.5.0",
	<<<<<<< HEAD
		"@banditsoftware/my-package": "14.14.0",
		"@banditsoftware/my-other-package": "2.0.0",
	=======
		"@banditsoftware/my-package": "14.14.2-filterror.0",
		"@banditsoftware/my-other-package": "1.0.0",
	>>>>>>> f07c714... Bumped my-package to 14.14.2-filterror.0: conflicting change
		"@banditsoftware/some-other-package": "1.3.0",
	}
}`);
			expect(util.writeFile).toHaveBeenCalledTimes(1);
			expect(util.writeFile).toHaveBeenCalledWith(
				"/some/root/path/package.json",
				`{
	"devDependencies": {
		"@banditsoftware/some-package": "2.5.0",
		"@banditsoftware/my-package": "14.14.2-filterror.0",
		"@banditsoftware/my-other-package": "2.0.0",
		"@banditsoftware/some-other-package": "1.3.0",
	}
}`
			);
		});

		it("should do nothing if conflict is false", () => {
			state = Object.assign(
				{
					conflict: false
				},
				state
			);

			run.resolvePackageJSONConflicts(state);
			expect(state).toEqual({
				conflict: false,
				filePaths: {
					rootPath: "/some/root/path",
					configPath: "/some/root/path/package.json",
					changeLogPath: "/some/root/path/CHANGELOG.md",
					packageLockJsonPath: "/some/root/path/package-lock.json",
					gitIgnorePath: "/some/root/path/.gitignore",
					pullRequestTemplatePath:
						"/some/root/path/.github/PULL_REQUEST_TEMPLATE.md"
				}
			});
			expect(util.writeFile).toHaveBeenCalledTimes(0);
		});
	});

	describe("retryRebase", () => {
		describe("success", () => {
			beforeEach(() => {
				git.diff = jest.fn(() => Promise.resolve());
				command.rebaseContinue = jest.fn(() => Promise.resolve());
			});

			it("should call 'git.diff'", () => {
				return run.retryRebase().then(() => {
					expect(git.diff).toHaveBeenCalledTimes(1);
				});
			});

			it("should call 'command.rebaseContinue' on success", () => {
				return run.retryRebase().then(() => {
					expect(command.rebaseContinue).toHaveBeenCalledTimes(1);
				});
			});
		});

		describe("failure", () => {
			beforeEach(() => {
				git.diff = jest.fn(() => Promise.reject());
			});

			it("should reject", () => {
				return run.retryRebase().catch(() => {
					expect(git.diff).toHaveBeenCalledTimes(1);
				});
			});
		});
	});
});
