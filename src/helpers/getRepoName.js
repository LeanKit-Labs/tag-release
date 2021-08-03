const runCommand = require("./runCommand");

const getRepoName = () => {
	const args = "basename `git rev-parse --show-toplevel`";
	return runCommand({ args, showOutput: false, fullCommand: true }).then(
		response => response.trim()
	);
};

module.exports = getRepoName;
