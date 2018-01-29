import * as run from "./steps/index";
import { rebaseUpdateLogCommitTagRelease } from "./shared";

export default [
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
];

export const promoteContinue = [
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
];
