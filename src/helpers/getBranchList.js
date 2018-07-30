const { branch } = require("../git");

const getBranchList = () => {
	return branch({}).then(branches => {
		branches = branches
			.trim()
			.split("\n")
			.map(b => b.trim());
		return Promise.resolve(branches);
	});
};

module.exports = getBranchList;
