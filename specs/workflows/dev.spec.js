describe("dev workflow", () => {
	let resetWorkflow;
	describe("has LK scope", () => {
		beforeEach(() => {
			jest.resetModules();
			jest.doMock("../../src/utils", () => ({
				hasLkScope: jest.fn(() => true)
			}));

			resetWorkflow = require("../../src/workflows/dev");
		});

		it("should have all of the required steps", () => {
			expect(resetWorkflow.length).toEqual(12);
		});
	});

	describe("doesn't have LK scope", () => {
		beforeEach(() => {
			jest.resetModules();
			jest.doMock("../../src/utils", () => ({
				hasLkScope: jest.fn(() => false)
			}));

			resetWorkflow = require("../../src/workflows/dev");
		});

		it("should have all of the required steps", () => {
			expect(resetWorkflow.length).toEqual(11);
		});
	});
});
