import * as run from "./steps";
import { createPullRequest } from "./shared";

export default [
	run.gitFetchUpstream,
	run.getPackageScope,
	run.getFeatureBranch,
	run.gitRebaseUpstreamBranch,
	run.saveState,
	run.gitRebaseUpstreamDevelop,
	...createPullRequest
];

export const keepTheBallRolling = [
	run.getPackageScope,
	...createPullRequest
];
