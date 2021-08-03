const filterFlowBasedOnDevelopBranch = require("../../src/helpers/filterFlowBasedOnDevelopBranch");

describe("filterFlowBasedOnDevelopBranch", () => {
	let workflow;
	beforeEach(() => {
		workflow = [
			{ name: "fetch" },
			{ name: "main" },
			{ name: "getDevelop" },
			{ name: "develop" },
			{ name: "Develop" },
			{ name: "checkout" },
			{ name: "branch" }
		];
	});

	describe("has develop", () => {
		it("should return workflow ", () => {
			const response = filterFlowBasedOnDevelopBranch(
				{ hasDevelopBranch: true },
				workflow
			);
			expect(response).toEqual([
				{ name: "fetch" },
				{ name: "main" },
				{ name: "getDevelop" },
				{ name: "develop" },
				{ name: "Develop" },
				{ name: "checkout" },
				{ name: "branch" }
			]);
		});
	});

	describe("no develop", () => {
		it("should filter and return workflow", () => {
			const response = filterFlowBasedOnDevelopBranch(
				{ hasDevelopBranch: false },
				workflow
			);
			expect(response).toEqual([
				{ name: "fetch" },
				{ name: "main" },
				{ name: "checkout" },
				{ name: "branch" }
			]);
		});
	});
});
