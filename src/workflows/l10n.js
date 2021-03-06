const run = require("./steps/index");

module.exports = {
	sync: [
		run.changeDirectory,
		run.gitStash,
		run.fetchUpstream,
		run.createOrCheckoutBranch,
		run.gitMergeUpstreamBranch,
		run.gitMergeUpstreamMasterNoFF,
		run.gitPushUpstreamFeatureBranch,
		run.diffWithUpstreamMaster
	],
	check: [
		run.changeDirectory,
		run.gitStash,
		run.fetchUpstream,
		run.createOrCheckoutBranch,
		run.gitMergeUpstreamBranch,
		run.diffWithUpstreamMaster,
		run.commitDiffWithUpstreamMaster,
		run.resetIfStashed
	],
	coverage: [
		run.changeDirectory,
		run.gitStash,
		run.fetchUpstream,
		run.checkoutMaster,
		run.gitResetMaster,
		run.buildLocale,
		run.getLangCodes,
		run.getl10nCoverage,
		run.resetIfStashed
	]
};
