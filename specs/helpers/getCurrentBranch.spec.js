const runCommand = require("../../src/helpers/runCommand");
const getCurrentBranch = require("../../src/helpers/getCurrentBranch");

jest.mock("../../src/helpers/runCommand", () =>
	jest.fn(() => Promise.resolve("feature-branch"))
);

describe("getCurrentBranch", () => {
	it("should return the current branch", () => {
		return getCurrentBranch().then(response => {
			expect(runCommand).toHaveBeenCalledTimes(1);
			expect(runCommand).toHaveBeenCalledWith({
				args: "rev-parse --abbrev-ref HEAD",
				showOutput: false
			});
			expect(response).toEqual("feature-branch");
		});
	});
});
