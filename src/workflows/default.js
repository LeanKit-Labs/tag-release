import * as run from "./steps";
import { rebaseUpdateLogCommitTagRelease } from "./shared";

export default [
	run.gitFetchUpstream,
	run.checkHasDevelopBranch,
	run.gitCheckoutMaster,
	run.gitMergeUpstreamMaster,
	...rebaseUpdateLogCommitTagRelease
];
