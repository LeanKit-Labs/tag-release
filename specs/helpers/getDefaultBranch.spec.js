const runCommand = require("../../src/helpers/runCommand");
const getDefaultBranch = require("../../src/helpers/getDefaultBranch");

jest.mock("../../src/helpers/runCommand", () =>
	jest.fn(() => Promise.resolve("main"))
);

describe("getCurrentBranch", () => {
	it("should return the current branch", () => {
		return getDefaultBranch().then(response => {
			expect(runCommand).toHaveBeenCalledTimes(1);
			expect(runCommand).toHaveBeenCalledWith({
				args: `remote show upstream | grep "HEAD branch" | sed 's/.*: //'`,
				showOutput: false
			});
			expect(response).toEqual("main");
		});
	});
});
