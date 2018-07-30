const run = require("./steps/index");
const { rebaseUpdateLogCommitTagRelease } = require("./shared");

module.exports = {
	promoteWorkflow: [
		run.fetchUpstream,
		run.selectPrereleaseToPromote,
		run.checkoutTag,
		run.gitGenerateRebaseCommitLog,
		run.gitRemovePreReleaseCommits,
		run.gitRebaseUpstreamMaster,
		run.checkoutMaster,
		run.gitMergeUpstreamMaster,
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
		run.checkoutMaster,
		run.gitMergeUpstreamMaster,
		run.gitMergePromotionBranch,
		...rebaseUpdateLogCommitTagRelease,
		run.cleanUpTmpFiles,
		run.findBranchByTag,
		run.deleteLocalFeatureBranch,
		run.deleteUpstreamFeatureBranch,
		run.gitRemovePromotionBranches
	]
};
