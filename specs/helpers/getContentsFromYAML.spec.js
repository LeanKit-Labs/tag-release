const utils = require("../../src/utils");
const getContentsFromYAML = require("../../src/helpers/getContentsFromYAML"); // eslint-disable-line no-unused-vars

jest.mock("../../src/utils", () => ({
	readYAMLFile: jest.fn(() => ({ "first.key": "one", "second.key": "two" }))
}));

describe("getContentsFromYAML", () => {
	it("should return contents of yaml file", () => {
		const response = getContentsFromYAML("./path", "en-US");
		expect(utils.readYAMLFile).toHaveBeenCalledTimes(1);
		expect(utils.readYAMLFile).toHaveBeenCalledWith("./path/en-US.yaml");
		expect(response).toEqual({ "first.key": "one", "second.key": "two" });
	});

	describe("nested yaml keys", () => {
		beforeEach(() => {
			utils.readYAMLFile = jest.fn(() => ({
				"en-US": {
					"nested.first.key": "one",
					"nested.second.key": "two"
				}
			}));
		});

		it("should return contents of yaml file", () => {
			const response = getContentsFromYAML("./path", "en-US");
			expect(utils.readYAMLFile).toHaveBeenCalledTimes(2);
			expect(utils.readYAMLFile).toHaveBeenCalledWith(
				"./path/en-US.yaml"
			);
			expect(response).toEqual({
				"nested.first.key": "one",
				"nested.second.key": "two"
			});
		});
	});
});
