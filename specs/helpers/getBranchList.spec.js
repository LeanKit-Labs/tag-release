const git = require("../../src/git");
const getBranchList = require("../../src/helpers/getBranchList"); // eslint-disable-line no-unused-vars

jest.mock("../../src/git", () => ({
	branch: jest.fn(() =>
		Promise.resolve(`feature-branch
promote-release-v1.1.1-feature.0
* master
develop
promote-release-v1.1.1-feature.1`)
	)
}));

describe("getBranchList", () => {
	it("should return a list of branches", () => {
		return getBranchList().then(response => {
			expect(git.branch).toHaveBeenCalledTimes(1);
			expect(response).toEqual([
				"feature-branch",
				"promote-release-v1.1.1-feature.0",
				"* master",
				"develop",
				"promote-release-v1.1.1-feature.1"
			]);
		});
	});
});
