import * as run from "./steps";
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
	run.gitMergeUpstreamBranch,
	run.checkHasDevelopBranch,
	...rebaseUpdateLogCommitTagRelease,
	run.cleanUpTmpFiles
];

export const keepTheBallRolling = [
	run.setPromote,
	run.checkHasDevelopBranch,
	run.gitCheckoutMaster,
	run.gitMergeUpstreamMaster,
	run.gitMergePromotionBranch,
	...rebaseUpdateLogCommitTagRelease,
	run.cleanUpTmpFiles
];
