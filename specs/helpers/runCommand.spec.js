const utils = require("../../src/utils");
const runCommand = require("../../src/helpers/runCommand");

jest.mock("../../src/utils", () => ({
	exec: jest.fn(() => Promise.resolve()),
	log: {
		begin: jest.fn(),
		end: jest.fn()
	},
	advise: jest.fn()
}));

describe("runCommand", () => {
	it("should call runCommand with appropriate args", () => {
		const branch = "main";
		const includeTags = true;
		const args = `fetch upstream ${branch}${includeTags ? " --tags" : ""}`;

		return runCommand({ args }).then(() => {
			expect(utils.exec).toHaveBeenCalledTimes(1);
			expect(utils.exec).toHaveBeenCalledWith(
				"git fetch upstream main --tags",
				undefined
			);
		});
	});

	it("should pass maxBuffer when provided", () => {
		const args = "--version";
		return runCommand({ args, maxBuffer: 123 }).then(() => {
			expect(utils.exec).toHaveBeenCalledTimes(1);
			expect(utils.exec).toHaveBeenCalledWith("git --version", 123);
		});
	});

	it("should log output by default", () => {
		return runCommand({ args: "--version" }).then(() => {
			expect(utils.log.begin).toHaveBeenCalledTimes(1);
			expect(utils.log.end).toHaveBeenCalledTimes(1);
		});
	});

	it("should log with the given `logMessage` when provided", () => {
		return runCommand({
			args: "--version",
			logMessage: "Get git version"
		}).then(() => {
			expect(utils.log.begin).toHaveBeenCalledTimes(1);
			expect(utils.log.begin).toHaveBeenCalledWith("Get git version");
		});
	});

	it("should log with the command with the `logMessage` option is not provided", () => {
		return runCommand({ args: "--version" }).then(() => {
			expect(utils.log.begin).toHaveBeenCalledTimes(1);
			expect(utils.log.begin).toHaveBeenCalledWith("git --version");
		});
	});

	describe("spinner", () => {
		let spinner;
		beforeEach(() => {
			spinner = {
				text: "text"
			};
		});

		it("should update spinner when provided", () => {
			return runCommand({
				args: "--version",
				repo: "demo_repo",
				spinner
			}).then(() => {
				expect(spinner.text).toEqual("demo_repo: git --version");
			});
		});

		it("should respect fullCommand flag", () => {
			return runCommand({
				args: "git log",
				repo: "demo_repo",
				spinner,
				fullCommand: true
			}).then(() => {
				expect(spinner.text).toEqual("demo_repo: git log");
			});
		});

		it("should respect logMessage", () => {
			return runCommand({
				args: "--version",
				repo: "demo_repo",
				spinner,
				logMessage: "demo log message"
			}).then(() => {
				expect(spinner.text).toEqual("demo_repo: demo log message");
			});
		});
	});

	describe("showOutput is false", () => {
		it("should not log output", () => {
			return runCommand({ args: "--version", showOutput: false }).then(
				() => {
					expect(utils.log.begin).not.toHaveBeenCalled();
					expect(utils.log.end).not.toHaveBeenCalled();
				}
			);
		});

		describe("maxBuffer is passed", () => {
			it("should not log output when and pass buffer", () => {
				return runCommand({
					args: "--version",
					showOutput: false,
					maxBuffer: 500
				}).then(() => {
					expect(utils.log.begin).not.toHaveBeenCalled();
					expect(utils.log.end).not.toHaveBeenCalled();
					expect(utils.exec).toHaveBeenCalled();
					expect(utils.exec).toHaveBeenCalledWith(
						"git --version",
						500
					);
				});
			});
		});
	});

	describe("process.env.NO_OUTPUT is true", () => {
		beforeEach(() => {
			process.env.NO_OUTPUT = true;
		});

		it("should not log output", () => {
			return runCommand({ args: "--version" }).then(() => {
				expect(utils.log.begin).not.toHaveBeenCalled();
				expect(utils.log.end).not.toHaveBeenCalled();
			});
		});

		afterEach(() => {
			delete process.env.NO_OUTPUT;
		});
	});

	it("should use full command and not append `git` when the `fullCommand` option is true", () => {
		return runCommand({ args: "some command", fullCommand: true }).then(
			() => {
				expect(utils.exec).toHaveBeenCalledTimes(1);
				expect(utils.exec).toHaveBeenCalledWith(
					"some command",
					undefined
				);
			}
		);
	});

	describe("failure", () => {
		beforeEach(() => {
			utils.exec = jest.fn(() => Promise.reject("fail"));
		});

		it("should reject when the command execution fails", () => {
			return runCommand({ args: "--version" }).catch(err => {
				expect(utils.log.end).toHaveBeenCalledTimes(1);
				expect(err).toEqual("fail");
			});
		});

		it("should reject with no error when the command execution fails and `showError` is false", () => {
			return runCommand({ args: "--version", showError: false }).catch(
				err => {
					expect(utils.log.end).toHaveBeenCalledTimes(1);
					expect(err).toEqual(undefined);
				}
			);
		});

		it("should use onError passed as arg when provided", () => {
			const onError = jest.fn(() => Promise.resolve(""));
			return runCommand({ args: "--version", onError }).catch(() => {
				expect(onError).toHaveBeenCalledTimes(1);
			});
		});
	});
});
