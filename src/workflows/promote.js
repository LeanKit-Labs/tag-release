const run = require("./steps/index");
const { rebaseUpdateLogCommitTagRelease } = require("./shared");

module.exports = {
	promoteWorkflow: [
		run.fetchUpstream,
		run.selectPrereleaseToPromote,
		run.checkoutTag,
		run.gitRebaseUpstreamDefaultBranch,
		run.checkoutDefaultBranch,
		run.gitMergeUpstreamDefaultBranch,
		run.gitMergePromotionBranch,
		...rebaseUpdateLogCommitTagRelease,
		run.cleanUpTmpFiles,
		run.findBranchByTag,
		run.deleteLocalFeatureBranch,
		run.deleteUpstreamFeatureBranch,
		run.gitRemovePromotionBranches
	],
	promoteContinue: [
		run.setPromote,
		run.checkoutDefaultBranch,
		run.gitMergeUpstreamDefaultBranch,
		run.gitMergePromotionBranch,
		...rebaseUpdateLogCommitTagRelease,
		run.cleanUpTmpFiles,
		run.findBranchByTag,
		run.deleteLocalFeatureBranch,
		run.deleteUpstreamFeatureBranch,
		run.gitRemovePromotionBranches
	]
};
