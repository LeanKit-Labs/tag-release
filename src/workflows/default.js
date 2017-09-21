import * as run from "./steps/index";
import { rebaseUpdateLogCommitTagRelease } from "./shared";

export default [
	run.gitFetchUpstream,
	run.gitCheckoutMaster,
	run.gitMergeUpstreamMaster,
	...rebaseUpdateLogCommitTagRelease
];
