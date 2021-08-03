const run = require("./steps/index");
const { rebaseUpdateLogCommitTagRelease } = require("./shared");

module.exports = [
	run.fetchUpstream,
	run.checkoutDefaultBranch,
	run.gitMergeUpstreamDefaultBranch,
	...rebaseUpdateLogCommitTagRelease
];
