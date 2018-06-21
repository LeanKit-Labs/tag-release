const chalk = require("chalk");
const { hasLkScope, renderHelpContent } = require("./utils");

let helpContent = `
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
