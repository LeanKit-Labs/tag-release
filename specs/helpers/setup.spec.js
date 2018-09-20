const setup = require("../../src/helpers/setup");
const api = require("../../src/workflows/steps/index.js"); // eslint-disable-line no-unused-vars
const getCurrentBranch = require("../../src/helpers/getCurrentBranch"); // eslint-disable-line no-unused-vars
const filterFlowBasedOnDevelopBranch = require("../../src/helpers/filterFlowBasedOnDevelopBranch"); // eslint-disable-line no-unused-vars
const utils = require("../../src/utils"); // eslint-disable-line no-unused-vars

jest.mock("../../src/workflows/steps/index.js", () => ({
	checkHasDevelopBranch: jest.fn(() => true)
}));

jest.mock("../../src/utils", () => ({
	exec: jest.fn(() => Promise.resolve()),
	getCurrentVersion: jest.fn(() => Promise.resolve("1.1.1")),
	fileExists: jest.fn(() => true),
	advise: jest.fn()
}));

jest.mock("../../src/helpers/filterFlowBasedOnDevelopBranch", () =>
	jest.fn(() => ["one", "two", "three"])
);
jest.mock("../../src/helpers/getCurrentBranch", () =>
	jest.fn(() => Promise.resolve("current-branch"))
);

describe("setup", () => {
	let state;

	beforeEach(() => {
		state = {};
	});

	it("should transform state", () => {
		return setup(state).then(() => {
			expect(state).toMatchObject({
				branch: "current-branch",
				workingBranch: "current-branch",
				configPath: "./package.json",
				version: "1.1.1",
				workflow: ["one", "two", "three"]
			});
		});
	});

	describe("callback provided", () => {
		it("should use provided callback", () => {
			const callback = jest.fn();
			state = { callback };
			return setup(state).then(() => {
				expect(state).toMatchObject({ callback });
			});
		});
	});

	describe("when configPath doesn't exist", () => {
		it("should advise", () => {
			utils.fileExists = jest.fn(() => false);
			state = { configPath: "blah.txt" };
			return setup(state).then(() => {
				expect(utils.advise).toHaveBeenCalledTimes(1);
				expect(utils.advise).toHaveBeenCalledWith("updateVersion");
			});
		});
	});
});
