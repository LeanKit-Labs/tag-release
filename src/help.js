import chalk from "chalk";
import util from "./utils";

const { hasLkScope, renderHelpContent } = util;

let helpContent = `
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

  Link to README: ${ chalk.yellow.underline.bold( "https://github.com/LeanKit-Labs/tag-release/blob/master/README.md" ) }
`;

if ( hasLkScope() ) {
	helpContent = `${ helpContent }  LeanKit tag-release workflow: ${ chalk.green.underline.bold( "https://leankit-wiki.atlassian.net/wiki/spaces/PD/pages/96347952/tag-release+workflow" ) }\n`;
}

const help = () => renderHelpContent( helpContent );

export default help;
