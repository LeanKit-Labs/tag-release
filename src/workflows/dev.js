import * as run from "./steps/index";

export default [
	run.gitFetchUpstream,
	run.checkHasDevelopBranch,
	run.getFeatureBranch,
	run.gitCreateBranchOrigin,
	run.gitCreateBranchUpstream,
	run.githubUpstream,
	run.githubOrigin,
	run.updatePullRequestTitle,
	run.updatePullRequestBody,
	run.createGithubPullRequestAganistBranch
];
