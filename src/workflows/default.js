const run = require("./steps/index");
const { rebaseUpdateLogCommitTagRelease } = require("./shared");

module.exports = [
	run.gitFetchUpstream,
	run.gitCheckoutMaster,
	run.gitMergeUpstreamMaster,
	...rebaseUpdateLogCommitTagRelease
];
