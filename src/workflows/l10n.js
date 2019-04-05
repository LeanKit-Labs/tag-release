const run = require("./steps/index");

module.exports = {
	sync: [
		run.changeDirectory,
		run.stashChanges,
		run.fetchUpstream,
		run.createOrCheckoutBranch,
		run.gitMergeUpstreamBranch,
		run.gitMergeUpstreamMasterNoFF,
		run.gitPushUpstreamFeatureBranch,
		run.diffWithUpstreamMaster
	],
	check: [
		run.changeDirectory,
		run.stashChanges,
		run.fetchUpstream,
		run.createOrCheckoutBranch,
		run.gitMergeUpstreamBranch,
		run.diffWithUpstreamMaster,
		run.commitDiffWithUpstreamMaster,
		run.resetIfStashed
	]
};
