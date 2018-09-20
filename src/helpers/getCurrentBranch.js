const runCommand = require("./runCommand");

const getCurrentBranch = () => {
	const args = "rev-parse --abbrev-ref HEAD";
	return runCommand({ args, showOutput: false }).then(response =>
		response.trim()
	);
};

module.exports = getCurrentBranch;
