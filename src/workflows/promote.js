const run = require("./steps/index");
const { rebaseUpdateLogCommitTagRelease } = require("./shared");

module.exports = {
	promoteWorkflow: [
		run.gitFetchUpstream,
		run.selectPrereleaseToPromote,
		run.gitCheckoutTag,
		run.getFeatureBranch,
		run.gitGenerateRebaseCommitLog,
		run.gitRemovePreReleaseCommits,
		run.gitRebaseUpstreamMaster,
		run.gitCheckoutMaster,
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
		run.gitCheckoutMaster,
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
