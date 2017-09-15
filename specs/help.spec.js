jest.mock( "chalk", () => ( {
	yellow: {
		underline: {
			bold: jest.fn( arg => arg )
		}
	},
	green: {
		underline: {
			bold: jest.fn( arg => arg )
		}
	}
} ) );

import chalk from "chalk"; // eslint-disable-line no-unused-vars

/* eslint-disable global-require */
describe( "help", () => {
	let util, help;

	beforeEach( () => {
		jest.doMock( "../src/utils", () => ( {
			hasLkScope: jest.fn( () => true ),
			renderHelpContent: jest.fn( arg => arg )
		} ) );

		util = require( "../src/utils" );
		help = require( "../src/help" ).default;
	} );

	it( "should return custom help output", () => {
		help();
		expect( util.renderHelpContent ).toHaveBeenCalledTimes( 1 );
		expect( util.renderHelpContent.mock.calls[ 0 ][ 0 ] ).toEqual( expect.stringContaining( `
  Examples:

    $ tag-release
    $ tag-release --config ../../config.json
    $ tag-release -c ./manifest.json
    $ tag-release --release major
    $ tag-release -r minor
    $ tag-release --prerelease
    $ tag-release -p -i rc
    $ tag-release --reset
    $ tag-release --verbose
    $ tag-release -v
    $ tag-release --promote
    $ tag-release --promote v1.1.1-my-tagged-version.0
    $ tag-release --continue
    $ tag-release --qa
    $ tag-release --qa myorg
    $ tag-release --pr
    $ tag-release --pr myorg

  Link to README: https://github.com/LeanKit-Labs/tag-release/blob/master/README.md
  LeanKit tag-release workflow: https://leankit-wiki.atlassian.net/wiki/spaces/PD/pages/96347952/tag-release+workflow
` 		) );
	} );

	describe( "when the user has an @lk registry scope", () => {
		it( "the help output should include a link to the LeanKit tag-release workflow doc", () => {
			help();
			expect( util.renderHelpContent.mock.calls[ 0 ][ 0 ] ).toEqual( expect.stringContaining( "LeanKit tag-release workflow: https://leankit-wiki.atlassian.net/wiki/spaces/PD/pages/96347952/tag-release+workflow" ) );
		} );
	} );

	describe( "when the user does not have an @lk registry scope", () => {
		beforeEach( () => {
			jest.resetModules();
			jest.doMock( "../src/utils", () => ( {
				hasLkScope: jest.fn( () => false ),
				renderHelpContent: jest.fn( arg => arg )
			} ) );

			util = require( "../src/utils" );
			help = require( "../src/help" ).default;
		} );

		it( "the help output should NOT include a link to the LeanKit tag-release workflow doc", () => {
			help();
			expect( util.renderHelpContent.mock.calls[ 0 ][ 0 ] ).not.toMatch( /LeanKit tag-release workflow: https:\/\/leankit-wiki.atlassian.net\/wiki\/spaces\/PD\/pages\/96347952\/tag-release+workflow/ );
		} );
	} );
} );
/* eslint-enable global-require */
