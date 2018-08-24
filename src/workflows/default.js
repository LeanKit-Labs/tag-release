const run = require("./steps/index");
const { rebaseUpdateLogCommitTagRelease } = require("./shared");

module.exports = [
	run.fetchUpstream,
	run.checkoutMaster,
	run.gitMergeUpstreamMaster,
	...rebaseUpdateLogCommitTagRelease
];
