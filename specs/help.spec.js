jest.mock("chalk", () => ({
	yellow: {
		underline: {
			bold: jest.fn(arg => arg)
		}
	},
	green: {
		underline: {
			bold: jest.fn(arg => arg)
		}
	}
}));

import chalk from "chalk"; // eslint-disable-line no-unused-vars

/* eslint-disable global-require */
describe("help", () => {
	let util, help;

	beforeEach(() => {
		jest.doMock("../src/utils", () => ({
			hasLkScope: jest.fn(() => true),
			renderHelpContent: jest.fn(arg => arg)
		}));

		util = require("../src/utils");
		help = require("../src/help").default;
	});

	it("should return custom help output", () => {
		help();
		expect(util.renderHelpContent).toHaveBeenCalledTimes(1);
		expect(util.renderHelpContent.mock.calls[0][0]).toEqual(
			expect.stringContaining(`
  Examples:

    $ tag-release                           # tag and release
    $ tag-release --config ../config.json   # specify new config
    $ tag-release -c ./manifest.json        # specify new config shorthand
    $ tag-release --prerelease              # prerelease branch
    $ tag-release -p -i rc                  # prerelease branch with identifier
    $ tag-release --reset                   # reset or initialize repo
    $ tag-release --verbose                 # add additional logging
    $ tag-release -v                        # add additional logging shorthand
    $ tag-release --promote                 # promote a prerelease tag
    $ tag-release --promote v1.1.1-my-tag.0 # promote a specific prerelease tag
    $ tag-release --continue                # continue a rebase after conflict
    $ tag-release --qa                      # create host repo qa branch
    $ tag-release --qa myorg                # create host repo qa branch w/scope
    $ tag-release --pr                      # create host repo pr into develop
    $ tag-release --pr myorg                # create host repo pr w/scope
    $ tag-release --help --verbose          # display workflow diagram

  Link to README: https://github.com/LeanKit-Labs/tag-release/blob/master/README.md
  LeanKit tag-release workflow: https://leankit-wiki.atlassian.net/wiki/spaces/PD/pages/96347952/tag-release+workflow
`)
		);
	});

	describe("when the user has an @lk registry scope", () => {
		it("the help output should include a link to the LeanKit tag-release workflow doc", () => {
			help();
			expect(util.renderHelpContent.mock.calls[0][0]).toEqual(
				expect.stringContaining(
					"LeanKit tag-release workflow: https://leankit-wiki.atlassian.net/wiki/spaces/PD/pages/96347952/tag-release+workflow"
				)
			);
		});
	});

	describe("when the user does not have an @lk registry scope", () => {
		beforeEach(() => {
			jest.resetModules();
			jest.doMock("../src/utils", () => ({
				hasLkScope: jest.fn(() => false),
				renderHelpContent: jest.fn(arg => arg)
			}));

			util = require("../src/utils");
			help = require("../src/help").default;
		});

		it("the help output should NOT include a link to the LeanKit tag-release workflow doc", () => {
			help();
			expect(util.renderHelpContent.mock.calls[0][0]).not.toMatch(
				/LeanKit tag-release workflow: https:\/\/leankit-wiki.atlassian.net\/wiki\/spaces\/PD\/pages\/96347952\/tag-release+workflow/
			);
		});
	});
});
/* eslint-enable global-require */
