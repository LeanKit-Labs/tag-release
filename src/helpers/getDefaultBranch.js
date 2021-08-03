const runCommand = require("./runCommand");

const BRANCHES = ["main", "master"];

const getDefaultBranch = () => {
	const args = `branch -r | grep upstream | sed 's/^.*upstream\\///'`;
	return runCommand({ args, showOutput: false }).then(response => {
		const resultBranches = response.trim().split("\n");
		return BRANCHES.find(b => resultBranches.includes(b));
	});
};

module.exports = getDefaultBranch;
