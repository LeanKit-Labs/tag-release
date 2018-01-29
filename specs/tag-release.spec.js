jest.mock("when/sequence", () => {
	return jest.fn(() => Promise.resolve());
});

jest.mock("../src/workflows/default", () => {
	return "default";
});

jest.mock("../src/workflows/pre-release", () => {
	return "pre-release";
});

jest.mock("../src/workflows/reset", () => {
	return "reset";
});

jest.mock("../src/workflows/promote", () => {
	return {
		default: "promote",
		promoteContinue: "promoteContinue"
	};
});

jest.mock("../src/workflows/continue", () => {
	return "continue";
});

jest.mock("../src/workflows/qa", () => {
	return {
		default: "qa",
		qaDefault: "qaDefault",
		qaUpdate: "qaUpdate"
	};
});

jest.mock("../src/workflows/pr", () => {
	return {
		default: "pr",
		prContinue: "prContinue"
	};
});

import sequence from "when/sequence";
import defaultWorkflow from "../src/workflows/default";
import prereleaseWorkflow from "../src/workflows/pre-release";
import resetWorkflow from "../src/workflows/reset";
import promoteWorkflow, { promoteContinue } from "../src/workflows/promote";
import continueWorkflow from "../src/workflows/continue";
import qaWorkflow, { qaDefault, qaUpdate } from "../src/workflows/qa";
import prWorkflow, {
	prRebaseSuccess,
	prRebaseConflict,
	prContinue
} from "../src/workflows/pr";
import tagRelease from "../src/tag-release";

describe("tag-release", () => {
	beforeEach(() => {
		sequence.mockImplementation(jest.fn(() => Promise.resolve()));
		console.log = jest.fn(); // eslint-disable-line no-console
	});

	it("should run the default workflow by default", () => {
		tagRelease({}).then(() => {
			expect(sequence).toHaveBeenCalledTimes(1);
			expect(sequence).toHaveBeenCalledWith(defaultWorkflow, {});
		});
	});

	it("should run the pre-release workflow when the CLI flag is passed", () => {
		tagRelease({ prerelease: true }).then(() => {
			expect(sequence).toHaveBeenCalledTimes(1);
			expect(sequence).toHaveBeenCalledWith(prereleaseWorkflow, {
				prerelease: true
			});
		});
	});

	it("should run the pre-release workflow when the CLI flag is passed", () => {
		tagRelease({ reset: true }).then(() => {
			expect(sequence).toHaveBeenCalledTimes(1);
			expect(sequence).toHaveBeenCalledWith(resetWorkflow, {
				reset: true
			});
		});
	});

	it("should run the reset workflow when both prerelease and reset flags are passed", () => {
		tagRelease({ prerelease: true, reset: true }).then(() => {
			expect(sequence).toHaveBeenCalledTimes(1);
			expect(sequence).toHaveBeenCalledWith(resetWorkflow, {
				prerelease: true,
				reset: true
			});
		});
	});

	it("should run the promote workflow when the CLI flag is passed", () => {
		tagRelease({ promote: true }).then(() => {
			expect(sequence).toHaveBeenCalledTimes(1);
			expect(sequence).toHaveBeenCalledWith(promoteWorkflow, {
				promote: true
			});
		});
	});

	describe("continue", () => {
		it("should run the continue workflow when the CLI flag is passed", () => {
			tagRelease({ continue: true, branch: "feature-branch" }).then(
				() => {
					expect(sequence).toHaveBeenCalledTimes(2);
					expect(sequence).toHaveBeenCalledWith(continueWorkflow, {
						continue: true,
						branch: "feature-branch"
					});
				}
			);
		});

		it("should run the promote continue workflow when continuing from a promote", () => {
			tagRelease({
				continue: true,
				branch: "promote-release-v1.1.1-feature.0"
			}).then(() => {
				expect(sequence).toHaveBeenCalledTimes(2);
				expect(sequence).toHaveBeenCalledWith(promoteContinue, {
					continue: true,
					branch: "promote-release-v1.1.1-feature.0"
				});
			});
		});

		it("should run the promote continue workflow when continuing from a pr workflow", () => {
			tagRelease({ continue: true, branch: "feature-branch" }).then(
				() => {
					expect(sequence).toHaveBeenCalledTimes(2);
					expect(sequence).toHaveBeenCalledWith(prContinue, {
						continue: true,
						branch: "feature-branch"
					});
				}
			);
		});
	});

	describe("qa", () => {
		it("should run the qa workflow when the CLI flag is passed", () => {
			tagRelease({ qa: true, packages: [] }).then(() => {
				expect(sequence).toHaveBeenCalledTimes(2);
				expect(sequence).toHaveBeenCalledWith(qaWorkflow, {
					qa: true,
					packages: []
				});
			});
		});

		it("should run the default qa workflow when the CLI flag is passed and there is no packages", () => {
			tagRelease({ qa: true, packages: [] }).then(() => {
				expect(sequence).toHaveBeenCalledTimes(2);
				expect(sequence).toHaveBeenCalledWith(qaDefault, {
					qa: true,
					packages: []
				});
			});
		});

		it("should run the default qa workflow when the CLI flag is passed, on develop and there are packages", () => {
			tagRelease({
				qa: true,
				packages: ["my-repo", "my-other-repo"],
				branch: "develop"
			}).then(() => {
				expect(sequence).toHaveBeenCalledTimes(2);
				expect(sequence).toHaveBeenCalledWith(qaDefault, {
					qa: true,
					packages: ["my-repo", "my-other-repo"],
					branch: "develop"
				});
			});
		});

		it("should run the default qa workflow when the CLI flag is passed, on master and there are packages", () => {
			tagRelease({
				qa: true,
				packages: ["my-repo", "my-other-repo"],
				branch: "master"
			}).then(() => {
				expect(sequence).toHaveBeenCalledTimes(2);
				expect(sequence).toHaveBeenCalledWith(qaDefault, {
					qa: true,
					packages: ["my-repo", "my-other-repo"],
					branch: "master"
				});
			});
		});

		it("should run the update qa workflow when the CLI flag is passed and there are packages", () => {
			tagRelease({
				qa: true,
				packages: ["my-repo", "my-other-repo"]
			}).then(() => {
				expect(sequence).toHaveBeenCalledTimes(2);
				expect(sequence).toHaveBeenCalledWith(qaUpdate, {
					qa: true,
					packages: ["my-repo", "my-other-repo"]
				});
			});
		});

		it("should run the update qa workflow when the CLI flag is passed, there are packages, and you are on a feature branch", () => {
			tagRelease({
				qa: true,
				packages: ["my-repo", "my-other-repo"],
				branch: "feature-branch"
			}).then(() => {
				expect(sequence).toHaveBeenCalledTimes(2);
				expect(sequence).toHaveBeenCalledWith(qaUpdate, {
					qa: true,
					packages: ["my-repo", "my-other-repo"],
					branch: "feature-branch"
				});
			});
		});
	});

	describe("pr", () => {
		it("should run the pr workflow when the CLI flag is passed", () => {
			tagRelease({ pr: true }).then(() => {
				expect(sequence).toHaveBeenCalledTimes(2);
				expect(sequence).toHaveBeenCalledWith(prWorkflow, { pr: true });
			});
		});

		it("should run the success pr workflow when the CLI flag is passed and there are no conflicts", () => {
			tagRelease({ pr: true, conflict: false }).then(() => {
				expect(sequence).toHaveBeenCalledTimes(2);
				expect(sequence).toHaveBeenCalledWith(prRebaseSuccess, {
					pr: true,
					conflict: false
				});
			});
		});

		it("should run the conflict pr workflow when the CLI flag is passed and there are conflicts", () => {
			tagRelease({ pr: true, conflict: true }).then(() => {
				expect(sequence).toHaveBeenCalledTimes(2);
				expect(sequence).toHaveBeenCalledWith(prRebaseConflict, {
					pr: true,
					conflict: true
				});
			});
		});
	});
});
