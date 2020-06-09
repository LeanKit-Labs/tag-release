const runCommand = require("../../src/helpers/runCommand");
const getRootDirectory = require("../../src/helpers/getRootDirectory");

jest.mock("../../src/helpers/runCommand", () =>
	jest.fn(() => Promise.resolve("/some/root/dir"))
);

describe("getRootDirectory", () => {
	it("should return the root git directory", () => {
		return getRootDirectory().then(response => {
			expect(runCommand).toHaveBeenCalledTimes(1);
			expect(runCommand).toHaveBeenCalledWith({
				args: "rev-parse --show-toplevel",
				showOutput: false
			});
			expect(response).toEqual("/some/root/dir");
		});
	});
});
