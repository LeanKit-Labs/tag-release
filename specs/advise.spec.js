jest.mock("word-wrap", () => {
	return jest.fn(arg => arg);
});

import wrap from "word-wrap";
import advise from "../src/advise";

describe("advise", () => {
	it("should call `wrap` to apply word wrap to the returned text", () => {
		advise("gitMergeMaster");
		const expectedText =
			"It looks like git couldn't merge master into develop.\n\nIt could be that your local environment is out of sync with your upstream.\n\nYou might consider reseting your develop by running 'git reset --hard upstream/develop'";
		expect(wrap).toHaveBeenCalledTimes(1);
		expect(wrap).toHaveBeenCalledWith(expectedText, {
			width: 50,
			indent: ""
		});
	});

	it("should return the appropriate text for the given key", () => {
		const result = advise("gitMergeMaster");
		const expectedResult =
			"It looks like git couldn't merge master into develop.\n\nIt could be that your local environment is out of sync with your upstream.\n\nYou might consider reseting your develop by running 'git reset --hard upstream/develop'";
		expect(result).toEqual(expectedResult);
	});
});
