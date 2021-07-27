const runCommand = require("./runCommand");

const getDefaultBranch = () => {
	const args = `remote show upstream | grep "HEAD branch" | sed 's/.*: //'`;
	return runCommand({ args, showOutput: false }).then(response =>
		response.trim()
	);
};

module.exports = getDefaultBranch;
