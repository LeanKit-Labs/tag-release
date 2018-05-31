import util from "./utils";
import path from "path";
import semver from "semver";

const DEFAULT_PRERELEASE_TAG_LIST_LIMIT = 10;

const git = {
	runCommand({
		args,
		showOutput = true,
		logMessage,
		failHelpKey = "gitCommandFailed",
		exitOnFail = false,
		showError = true,
		fullCommand = false,
		maxBuffer,
		onError
	}) {
		const command = fullCommand ? `${args}` : `git ${args}`;

		if (!showOutput) {
			return util.exec(command, maxBuffer ? maxBuffer : undefined);
		}

		if (onError === undefined) {
			onError = err => {
				util.advise(failHelpKey, { exit: exitOnFail });

				return showError
					? () => Promise.reject(err)
					: () => Promise.reject();
			};
		}

		util.log.begin(logMessage || command);
		return util
			.exec(command, maxBuffer ? maxBuffer : undefined)
			.then(result => {
				util.log.end();
				return Promise.resolve(result);
			})
			.catch(err => {
				util.log.end();
				return onError(err)();
			});
	},

	branch({ option, branch, tracking, tag, showOutput, logMessage, onError }) {
		const args = `branch${option ? ` ${option}` : ""}${
			branch ? ` ${branch}` : ""
		}${tag ? ` tags/${tag}` : ""}${
			tracking ? ` upstream/${tracking}` : ""
		}`;

		return git.runCommand(
			logMessage && logMessage.length
				? { args, showOutput, logMessage, onError }
				: { args, showOutput, onError }
		);
	},

	getRemoteBranches() {
		return git.branch({
			option: "-r"
		});
	},

	getAllBranchesWithTag(tag) {
		return git.branch({
			option: "-a --contains",
			tag
		});
	},

	fetch(failHelpKey) {
		const args = `fetch upstream --tags`;
		return git.runCommand(
			failHelpKey && failHelpKey.length ? { args, failHelpKey } : { args }
		);
	},

	fetchUpstream() {
		return git.fetch("gitFetchUpstream");
	},

	checkout({ branch, option, tag, failHelpKey, onError }) {
		const args = `checkout ${option ? `${option} ` : ""}${branch}${
			tag ? ` ${tag}` : ""
		}`;
		return git.runCommand(
			failHelpKey && failHelpKey.length
				? { args, failHelpKey, onError }
				: { args, onError }
		);
	},

	checkoutMaster() {
		return git.checkout({
			branch: "master"
		});
	},

	checkoutDevelop() {
		return git.checkout({
			branch: "develop",
			failHelpKey: "gitCheckoutDevelop"
		});
	},

	checkoutBranch(branch) {
		return git.checkout({
			branch
		});
	},

	merge({ branch, remote, fastForwardOnly = true, failHelpKey }) {
		const args = `merge ${remote ? `${remote}/${branch}` : `${branch}`}${
			fastForwardOnly ? " --ff-only" : " --no-ff"
		}`;
		return git.runCommand(
			failHelpKey && failHelpKey.length ? { args, failHelpKey } : { args }
		);
	},

	rebase({
		branch,
		remote = "upstream",
		failHelpKey,
		onError,
		exitOnFail = true
	}) {
		const args = `rebase ${remote}/${branch} --preserve-merges`;
		return git.runCommand(
			failHelpKey && failHelpKey.length
				? { args, failHelpKey, exitOnFail, onError }
				: { args, exitOnFail, onError }
		);
	},

	mergeMaster() {
		return git.merge({
			branch: "master",
			failHelpKey: "gitMergeMaster"
		});
	},

	mergeUpstreamMaster() {
		return git.merge({
			branch: "master",
			remote: "upstream"
		});
	},

	mergeUpstreamDevelop() {
		return git.merge({
			branch: "develop",
			remote: "upstream"
		});
	},

	mergePromotionBranch(tag) {
		return git.merge({
			branch: `promote-release-${tag}`,
			fastForwardOnly: false
		});
	},

	getCurrentBranch() {
		const args = "rev-parse --abbrev-ref HEAD";
		return git.runCommand({ args, log: "Getting current branch" });
	},

	getTagList() {
		const args = "tag --sort=v:refname";
		return git
			.runCommand({ args, logMessage: "Getting list of tags" })
			.then(tags => {
				tags = tags.trim();
				tags = tags.split("\n");
				return Promise.resolve(tags);
			});
	},

	getPrereleaseTagList(limit = DEFAULT_PRERELEASE_TAG_LIST_LIMIT) {
		const args = "tag --sort=-v:refname";
		return git
			.runCommand({ args, logMessage: "Getting list of pre-releases" })
			.then(tagList => {
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

	shortLog(tag) {
		let args = `--no-pager log --no-merges --date-order --pretty=format:"%s"`;
		args = tag && tag.length ? `${args} ${tag}..` : args;
		return git.runCommand({ args, logMessage: "Parsing git log" });
	},

	diff({
		option = "--color",
		files,
		maxBuffer,
		logMessage,
		failHelpKey,
		showError,
		onError
	}) {
		const args = `diff ${option}${files ? ` ${files.join(" ")}` : ""}`;
		return git.runCommand({
			args,
			maxBuffer,
			logMessage,
			failHelpKey,
			showError,
			onError
		});
	},

	add({ option, files = [] }) {
		const args = `add ${option ? `${option}` : ""}${files.join(" ")}`;
		return git.runCommand({ args });
	},

	commit(comment) {
		const args = `commit -m "${comment}"`;
		return git.runCommand({ args });
	},

	amend(comment) {
		const args = `commit --amend -m "${comment}"`;
		return git.runCommand({ args });
	},

	tag({ tag, annotation }) {
		const args = `tag -a ${tag} -m ${annotation || tag}`;
		return git.runCommand({ args });
	},

	push({
		branch,
		remote,
		base,
		option,
		includeTags,
		logMessage,
		failHelpKey,
		onError
	}) {
		const args = `push ${option ? `${option} ` : ""}${remote} ${
			base ? `${base}:${branch}` : `${branch}`
		}${includeTags ? " --tags" : ""}`;
		return git.runCommand(
			failHelpKey && failHelpKey.length
				? { args, failHelpKey, logMessage, onError }
				: { args, logMessage, onError }
		);
	},

	pushUpstreamMaster() {
		return git.push({
			branch: "master",
			remote: "upstream",
			failHelpKey: "gitPushUpstreamFeatureBranch"
		});
	},

	pushUpstreamMasterWithTags() {
		return git.push({
			branch: "master",
			remote: "upstream",
			includeTags: true
		});
	},

	pushOriginMaster() {
		return git.push({
			branch: "master",
			remote: "origin"
		});
	},

	pushOriginMasterWithTags() {
		return git.push({
			branch: "master",
			remote: "origin",
			includeTags: true
		});
	},

	pushUpstreamDevelop() {
		return git.push({
			branch: "develop",
			remote: "upstream"
		});
	},

	uncommittedChangesExist() {
		const args = "diff-index HEAD --";
		return git.runCommand({
			args,
			logMessage: "Checking for uncommitted changes"
		});
	},

	stash() {
		const args = "stash";
		return git.runCommand({
			args,
			logMessage: "Stashing uncommitted changes"
		});
	},

	branchExists(branch) {
		return git
			.branch({
				option: "--list",
				branch,
				logMessage: `Verifying branch: "${branch}" exists`
			})
			.then(result => {
				const branches = result.split("\n").filter(String);
				return Promise.resolve(!!branches.length);
			});
	},

	branchExistsRemote({ branch, remote }) {
		const args = `ls-remote ${remote} ${branch}`;
		return git
			.runCommand({
				args,
				logMessage: `Checking if "${branch}" exists on ${remote}`
			})
			.then(result => {
				const branches = result.split("\n").filter(String);
				return Promise.resolve(!!branches.length);
			});
	},

	createLocalBranch(branch, tracking = branch) {
		return git.branch({
			branch,
			tracking,
			logMessage: `Creating local branch "${branch}"`
		});
	},

	resetBranch(branch) {
		const args = `reset --hard upstream/${branch}`;
		return git.runCommand({
			args,
			logMessage: `Hard reset on branch: "${branch}"`
		});
	},

	checkoutTag({ tag }) {
		return git.checkout({
			branch: `promote-release-${tag}`,
			option: "-b",
			tag
		});
	},

	generateRebaseCommitLog() {
		const preReleaseRegEx = /^v?\d+\.\d+\.\d+-.+\.\d+$/;
		const gitLogMsgRegEx = /^[0-9a-f]{5,40} (.*)/;

		const args = `log upstream/master..HEAD --pretty=format:"%h %s"`;
		return git.runCommand({ args }).then(result => {
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

	removePreReleaseCommits() {
		const args = `GIT_SEQUENCE_EDITOR="cat ${path.join(
			__dirname,
			".commits-to-rebase.txt"
		)} >" git rebase -i -p upstream/master`;
		return git.runCommand({
			args,
			logMessage: "Removing pre-release commit history",
			failHelpKey: "gitRebaseInteractive",
			exitOnFail: true,
			fullCommand: true
		});
	},

	rebaseUpstreamMaster({ onError } = {}) {
		return git.rebase({
			branch: "master",
			remote: "upstream",
			onError
		});
	},

	getBranchList() {
		return git
			.branch({
				logMessage: "Getting branch list"
			})
			.then(branches => {
				branches = branches.trim();
				branches = branches.split("\n");
				branches = branches.map(branch => branch.trim());
				return Promise.resolve(branches);
			});
	},

	removePromotionBranches() {
		return git.getBranchList().then(branches => {
			branches = branches.filter(branch =>
				branch.includes("promote-release")
			);
			return Promise.all(
				branches.map(branch =>
					git.deleteBranch({ branch, showOutput: false })
				)
			);
		});
	},

	deleteBranch({ branch, showOutput, logMessage = "", onError = {} }) {
		return git.branch({
			option: "-D",
			branch,
			showOutput,
			logMessage,
			onError
		});
	},

	deleteBranchUpstream({ branch, logMessage = "", onError = {} }) {
		return git.push({
			branch: `:${branch}`,
			remote: "upstream",
			logMessage,
			onError
		});
	},

	stageFiles() {
		return git.add({
			option: "-u"
		});
	},

	rebaseContinue() {
		const args = `GIT_EDITOR="cat" git rebase --continue`;
		return git.runCommand({
			args,
			logMessage: "Continuing with rebase",
			failHelpKey: "gitRebaseInteractive",
			showError: false,
			fullCommand: true
		});
	},

	checkConflictMarkers() {
		return git.diff({
			option: "--check",
			logMessage: "Verifying conflict resolution",
			failHelpKey: "gitCheckConflictMarkers",
			showError: false
		});
	},

	checkoutAndCreateBranch({ branch, onError = {} }) {
		return git.checkout({
			branch,
			option: "-b",
			onError
		});
	},

	rebaseUpstreamBranch({ branch, onError }) {
		return git.rebase({
			branch,
			remote: "upstream",
			onError
		});
	},

	rebaseUpstreamDevelop({ onError } = {}) {
		return git.rebase({
			branch: "develop",
			remote: "upstream",
			failHelpKey: "gitRebaseUpstreamDevelop",
			exitOnFail: true,
			onError
		});
	},

	getLatestCommitMessage() {
		const args = `log --format=%B -n 1`;
		return git.runCommand({ args });
	},

	cleanUp() {
		util.deleteFile(path.join(__dirname, ".commits-to-rebase.txt"));

		return Promise.resolve();
	},

	status(showOutput) {
		const args = "status";
		return git.runCommand({ args, showOutput });
	},

	createRemoteBranch({ branch, remote = "upstream", base = "master" }) {
		return git.push({
			branch,
			option: "-u",
			base,
			remote
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

	getLastCommitText(showOutput = false) {
		const args = "log -1 --pretty=%B";
		return git.runCommand({ args, showOutput });
	},

	remote() {
		const args = "remote";
		return git.runCommand({ args });
	}
};

export default git;
