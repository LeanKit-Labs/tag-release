const runCommand = require("../../src/helpers/runCommand");
const getDefaultBranch = require("../../src/helpers/getDefaultBranch");

jest.mock("../../src/helpers/runCommand", () =>
	jest.fn(() => Promise.resolve("main"))
);

describe("getDefaultBranch", () => {
	[
		{
			branches: `
main
test
master`,
			result: "main"
		},
		{
			branches: `
test
master`,
			result: "master"
		},
		{
			branches: `
test
main`,
			result: "main"
		},
		{
			branches: `
test
main
master`,
			result: "main"
		},
		{
			branches: `
test
again`,
			result: undefined
		}
	].forEach(run => {
		it("should return expected branch", () => {
			runCommand.mockImplementation(() => Promise.resolve(run.branches));
			return getDefaultBranch().then(response => {
				expect(runCommand).toHaveBeenCalledTimes(1);
				expect(runCommand).toHaveBeenCalledWith({
					args: `branch -r | grep upstream | sed 's/^.*upstream\\///'`,
					showOutput: false
				});
				expect(response).toEqual(run.result);
			});
		});
	});
});
