const run = require("./steps/index");

module.exports = {
	sync: [
		run.changeDirectory,
		run.gitStash,
		run.fetchUpstream,
		run.createOrCheckoutBranch,
		run.gitMergeUpstreamBranch,
		run.gitMergeUpstreamDefaultBranchNoFF,
		run.gitPushUpstreamFeatureBranch,
		run.diffWithUpstreamDefaultBranch
	],
	check: [
		run.changeDirectory,
		run.gitStash,
		run.fetchUpstream,
		run.createOrCheckoutBranch,
		run.gitMergeUpstreamBranch,
		run.diffWithUpstreamDefaultBranch,
		run.commitDiffWithUpstreamDefaultBranch,
		run.resetIfStashed
	],
	coverage: [
		run.changeDirectory,
		run.gitStash,
		run.fetchUpstream,
		run.checkoutDefaultBranch,
		run.gitResetDefaultBranch,
		run.buildLocale,
		run.getLangCodes,
		run.getl10nCoverage,
		run.resetIfStashed
	]
};
