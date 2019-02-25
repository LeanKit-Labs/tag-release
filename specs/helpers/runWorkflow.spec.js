/* eslint-disable no-console */
const runWorkflow = require("../../src/helpers/runWorkflow");
const sequence = require("when/sequence"); // eslint-disable-line no-unused-vars
const path = require("path");
const fs = require("fs");

jest.mock("when/sequence", () => jest.fn(() => Promise.resolve()));

jest.mock("fs", () => ({
	appendFileSync: jest.fn()
}));

describe("runWorkflow", () => {
	let joinSpy, state, workflow;

	beforeEach(() => {
		global.Date = () => ({
			toLocaleString: jest.fn(() => "2112-12-31 23:59:59")
		});
		joinSpy = jest.spyOn(path, "join").mockImplementation(() => "my_path/");
		state = {
			callback: jest.fn()
		};
		workflow = ["first", "second", "third"];
	});

	afterEach(() => {
		joinSpy.mockRestore();
		state = {
			callback: jest.fn()
		};
		workflow = ["first", "second", "third"];
	});

	describe("when resolved", () => {
		it("should call callback", () => {
			return runWorkflow(workflow, state).then(() => {
				expect(state.callback).toHaveBeenCalledTimes(1);
				expect(state.callback).toHaveBeenCalledWith(state);
			});
		});
	});

	describe("when rejected", () => {
		beforeEach(() => {
			state = {
				version: "1.1.1",
				command: "tests",
				step: "it"
			};
			console.log = jest.fn(() => {}); // eslint-disable-line no-console
		});

		it("should output error", () => {
			return runWorkflow(workflow, state).then(() => {
				expect(console.log).toHaveBeenCalledTimes(2);
				expect(console.log.mock.calls[0][2]).toBe(`
Tag-release encountered a problem:`);
			});
		});

		describe("spinner", () => {
			describe("exists", () => {
				it("should call fail on spinner", () => {
					const fail = jest.fn();
					state.spinner = {
						fail
					};
					return runWorkflow(workflow, state).then(() => {
						expect(fail).toHaveBeenCalledTimes(1);
					});
				});
			});

			describe("doesn't exist", () => {
				it("shouldn't call fail on spinner", () => {
					const fail = jest.fn();
					state.spinner = undefined;
					return runWorkflow(workflow, state).then(() => {
						expect(fail).toHaveBeenCalledTimes(0);
					});
				});
			});
		});

		describe("logging error to file", () => {
			it("should write error", () => {
				return runWorkflow(workflow, state).then(() => {
					expect(fs.appendFileSync).toHaveBeenCalledTimes(1);
					expect(fs.appendFileSync.mock.calls[0][1])
						.toBe(`2112-12-31 23:59:59
	version: 1.1.1
	command: tests
	step: it
	error: options.callback is not a function\n\n`);
				});
			});
		});
	});
});
