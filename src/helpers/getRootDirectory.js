const runCommand = require("./runCommand");

const getRootDirectory = () => {
	const args = "rev-parse --show-toplevel";
	return runCommand({ args, showOutput: false }).then(response =>
		response.trim()
	);
};

module.exports = getRootDirectory;
