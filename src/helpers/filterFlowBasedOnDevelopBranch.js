const filterFlowBasedOnDevelopBranch = ({ hasDevelopBranch }, flow) => {
	if (!hasDevelopBranch) {
		return flow.filter(
			method => !method.name.toLowerCase().includes("develop")
		);
	}
	return flow;
};

module.exports = filterFlowBasedOnDevelopBranch;
