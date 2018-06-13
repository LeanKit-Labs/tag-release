const chalk = require("chalk");
const { hasLkScope, renderHelpContent } = require("./utils");

let helpContent = `
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
    $ tag-release --dev                     # create origin branch into upstream branch pr
    $ tag-release --help --verbose          # display workflow diagram
    $ tag-release --maxbuffer 3000          # override stdout maxBuffer

  Link to README: ${chalk.yellow.underline.bold(
		"https://github.com/LeanKit-Labs/tag-release/blob/master/README.md"
	)}
`;

if (hasLkScope()) {
	helpContent = `${helpContent}  LeanKit tag-release workflow: ${chalk.green.underline.bold(
		"https://leankit-wiki.atlassian.net/wiki/spaces/PD/pages/96347952/tag-release+workflow"
	)}\n`;
}

const help = () => renderHelpContent(helpContent);

module.exports = help;
