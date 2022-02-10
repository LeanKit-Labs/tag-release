const util = require("./utils");
const path = require("path");
const semver = require("semver");
const git = require("./git");
const runCommand = require("./helpers/runCommand");
const getBranchList = require("./helpers/getBranchList");

const DEFAULT_PRERELEASE_TAG_LIST_LIMIT = 10;

const command = {
	branchExists(branch, spinner, repo) {
		return git
			.branch({
				branch,
				option: "--list",
				logMessage: `verifying "${branch}" exists`,
				spinner,
				repo
			})
			.then(result => {
				const branches = result.split("\n").filter(b => !!b);
				return Promise.resolve(!!branches.length);
			});
	},

	branchExistsRemote({ branch, remote, spinner, repo }) {
		const args = `ls-remote ${remote} ${branch}`;
		return runCommand({
			args,
			logMessage: `checking if "${branch}" exists on ${remote}`,
			spinner,
			repo
		}).then(result => {
			const branches = result.split("\n").filter(String);
			return Promise.resolve(!!branches.length);
		});
	},

	checkConflictMarkers() {
		return git.diff({
			option: "--check",
			logMessage: "verifying conflict resolution",
			failHelpKey: "gitCheckConflictMarkers",
			showError: false
		});
	},

	checkoutAndCreateBranch({ branch, onError }) {
		return git.checkout({
			branch,
			option: "-b",
			onError
		});
	},

	checkoutBranch({ branch, spinner, repo }) {
		return git.checkout({
			branch,
			spinner,
			repo
		});
	},

	checkoutTag({ tag }) {
		return git.checkout({
			branch: `promote-release-${tag}`,
			option: "-b",
			tag
		});
	},

	commitAmend({ comment }) {
		return git.commit({
			option: "--amend -m",
			comment
		});
	},

	createLocalBranch(branch, tracking = branch) {
		return git.branch({
			branch,
			tracking,
			logMessage: `creating local branch "${branch}"`
		});
	},

	cleanUp() {
		util.deleteFile(path.join(__dirname, ".commits-to-rebase.txt"));
		util.deleteFile(path.join(__dirname, ".reordered-commits.txt"));

		return Promise.resolve();
	},

	createRemoteBranch({ branch, remote, base }) {
		return git.push({
			branch,
			remote,
			base
		});
	},

	deleteBranch({ branch, showOutput = true, logMessage = "", onError }) {
		return git.branch({
			branch,
			option: "-D",
			showOutput,
			logMessage,
			onError
		});
	},

	deleteBranchUpstream({ branch, logMessage = "", onError }) {
		return git.push({
			branch: `:${branch}`,
			remote: "upstream",
			logMessage,
			onError
		});
	},

	fetchUpstream({ spinner, repo }) {
		return git.fetch({ spinner, repo, failHelpKey: "fetchUpstream" });
	},

	generateRebaseCommitLog({ branch }) {
		const preReleaseRegEx = /^v?\d+\.\d+\.\d+-.+\.\d+$/;
		const gitLogMsgRegEx = /^[0-9a-f]{5,40} (.*)/;

		const args = `log upstream/${branch}..HEAD --pretty=format:"%h %s"`;
		return runCommand({ args }).then(result => {
			let commits = result.split("\n");

			commits = commits.reduce((memo, commit) => {
				const [, commitMsg] = gitLogMsgRegEx.exec(commit) || [];

				if (!preReleaseRegEx.test(commitMsg)) {
					memo.push(`pick ${commit}`.trim());
				}
				return memo;
			}, []);

			// adding a '\n' at the end of the .reverse().join() statement is required as the rebase -i file requires it to be there or
			// it will remove the last line in the file, which would be a whole commit potentially.
			util.writeFile(
				path.join(__dirname, ".commits-to-rebase.txt"),
				`${commits.reverse().join("\n")}\n`
			);
		});
	},

	reOrderLatestCommits({ branch }) {
		const bumpedRegEx = /Bumped (.*): (.*)/;
		const gitLogMsgRegEx = /^[0-9a-f]{5,40} (.*)/;

		const args = `log upstream/${branch}..HEAD --pretty=format:"%h %s"`;
		return runCommand({ args }).then(result => {
			let commits = result.split("\n");

			let bumpCommit;
			commits = commits.reduce((memo, commit) => {
				const [, commitMsg] = gitLogMsgRegEx.exec(commit) || [];

				if (bumpedRegEx.test(commitMsg)) {
					bumpCommit = commit;
				} else if (commitMsg && !commitMsg.startsWith("Merge")) {
					memo.push(`pick ${commit}`.trim());
				}

				return memo;
			}, []);

			if (bumpCommit) {
				commits.unshift(`pick ${bumpCommit}`.trim());
			}

			// adding a '\n' at the end of the .reverse().join() statement is required as the rebase -i file requires it to be there or
			// it will remove the last line in the file, which would be a whole commit potentially.
			util.writeFile(
				path.join(__dirname, ".reordered-commits.txt"),
				`${commits.reverse().join("\n")}\n`
			);
			return !!bumpCommit;
		});
	},

	getRemoteBranches() {
		return git.branch({
			option: "-r",
			showOutput: false
		});
	},

	getAllBranchesWithTag(tag) {
		return git.branch({
			option: "-a --contains",
			tag
		});
	},

	getTagList(spinner, repo) {
		const args = "tag --sort=v:refname";
		return runCommand({
			args,
			logMessage: "getting list of tags",
			spinner,
			repo
		}).then(tags => {
			tags = tags.trim();
			tags = tags.split("\n");
			return Promise.resolve(tags);
		});
	},

	getPrereleaseTagList(limit = DEFAULT_PRERELEASE_TAG_LIST_LIMIT) {
		const args = "tag --sort=-v:refname";
		return runCommand({
			args,
			logMessage: "getting list of pre-releases"
		}).then(tagList => {
			const tags = tagList.split("\n");
			const prereleaseTags = tags
				.filter(tag => tag.includes("-"))
				.map(tag => tag.trim());

			const latestTags = prereleaseTags.reduce((acc, cur) => {
				const key = cur.slice(0, cur.lastIndexOf("."));
				if (acc[key]) {
					acc[key] =
						semver.compare(acc[key], cur) >= 0 ? acc[key] : cur;
				} else {
					acc[key] = cur;
				}
				return acc;
			}, {});

			const flattened = Object.keys(latestTags).map(key => {
				return latestTags[key];
			});

			return Promise.resolve(flattened.slice(0, limit));
		});
	},

	getLatestCommitMessage() {
		const args = "log --format=%B -n 1";
		return runCommand({ args });
	},

	getLastCommitText(showOutput = false) {
		const args = "log -1 --pretty=%B";
		return runCommand({ args, showOutput });
	},

	mergeDefaultBranch({ branch }) {
		return git.merge({
			branch,
			failHelpKey: "gitMergeDevelopWithDefaultBranch"
		});
	},

	mergePromotionBranch(tag) {
		return git.merge({
			branch: `promote-release-${tag}`,
			fastForwardOnly: false
		});
	},

	mergeUpstreamDevelop() {
		return git.merge({
			branch: "develop",
			remote: "upstream"
		});
	},

	mergeUpstreamDefaultBranch({ branch }) {
		return git.merge({
			branch,
			remote: "upstream"
		});
	},

	pushRemoteBranch({ branch, remote = "origin", onError }) {
		return git.push({
			branch,
			option: "-u",
			remote,
			onError
		});
	},

	pushUpstreamDefaultBranch({ branch }) {
		return git.push({
			branch,
			remote: "upstream",
			failHelpKey: "gitPushUpstreamFeatureBranch"
		});
	},

	pushUpstreamDefaultBranchWithTag({ branch, tag }) {
		return git.push({
			branch,
			remote: "upstream",
			tag
		});
	},

	pushOriginDefaultBranch({ branch }) {
		return git.push({
			branch,
			remote: "origin"
		});
	},

	pushUpstreamDevelop() {
		return git.push({
			branch: "develop",
			remote: "upstream"
		});
	},

	resetBranch(branch) {
		const args = `reset --hard upstream/${branch}`;
		return runCommand({ args });
	},

	removePreReleaseCommits({ branch, onError }) {
		const args = `GIT_SEQUENCE_EDITOR="cat ${path.join(
			__dirname,
			".commits-to-rebase.txt"
		)} >" git rebase -i --preserve-merges upstream/${branch}`;
		return runCommand({
			args,
			logMessage: "Removing pre-release commit history",
			failHelpKey: "gitRebaseInteractive",
			exitOnFail: true,
			fullCommand: true,
			onError
		});
	},

	reOrderBumpCommit({ branch, onError }) {
		const args = `GIT_SEQUENCE_EDITOR="cat ${path.join(
			__dirname,
			".reordered-commits.txt"
		)} >" git rebase -i upstream/${branch}`;
		return runCommand({
			args,
			logMessage: "Reordering bump commit",
			failHelpKey: "gitRebaseInteractive",
			exitOnFail: true,
			fullCommand: true,
			onError
		});
	},

	rebaseUpstreamDefaultBranch({ branch, onError }) {
		return git.rebase({
			branch,
			remote: "upstream",
			failHelpKey: "gitRebaseUpstreamBase",
			exitOnFail: true,
			onError
		});
	},

	removePromotionBranches() {
		return getBranchList().then(branches => {
			branches = branches.filter(branch =>
				branch.includes("promote-release")
			);
			return Promise.all(
				branches.map(branch =>
					command.deleteBranch({ branch, showOutput: false })
				)
			);
		});
	},

	rebaseContinue({ onError } = {}) {
		const args = `GIT_EDITOR="cat" git rebase --continue`;
		return runCommand({
			args,
			logMessage: "continuing with rebase",
			failHelpKey: "gitRebaseInteractive",
			showError: false,
			fullCommand: true,
			onError
		});
	},

	rebaseUpstreamBranch({ branch, onError }) {
		return git.rebase({
			branch,
			remote: "upstream",
			onError,
			exitOnFail: false
		});
	},

	rebaseUpstreamDevelop({ onError } = {}) {
		return git.rebase({
			branch: "develop",
			remote: "upstream",
			failHelpKey: "gitRebaseUpstreamBase",
			exitOnFail: true,
			onError
		});
	},

	shortLog(tag, spinner, repo) {
		let args = `--no-pager log --no-merges --date-order --pretty=format:"%s"`;
		args = tag && tag.length ? `${args} ${tag}..` : args;
		return runCommand({
			args,
			logMessage: "parsing git log",
			spinner,
			repo
		});
	},

	stageFiles() {
		return git.add({
			option: "-u"
		});
	},

	uncommittedChangesExist({ spinner, repo }) {
		const args = "diff-index HEAD --";
		return runCommand({
			args,
			spinner,
			repo,
			logMessage: "checking for uncommitted changes"
		});
	},

	checkIfPublished({ name, onError }) {
		const args = `npm info ${name}`;
		return runCommand({
			args,
			onError,
			fullCommand: true
		});
	}
};

module.exports = command;
