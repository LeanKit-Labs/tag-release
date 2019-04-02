const runCommand = require("./helpers/runCommand");
const getCurrentBranch = require("./helpers/getCurrentBranch");

const git = {
	add({ option, files = [], spinner, repo }) {
		const args = `add${option ? ` ${option}` : ""} ${files.join(" ")}`;
		return runCommand({ args, spinner, repo });
	},

	branch({
		branch,
		option,
		tag,
		tracking,
		showOutput,
		logMessage,
		spinner,
		repo,
		onError
	}) {
		const args = `branch${option ? ` ${option}` : ""}${
			branch ? ` ${branch}` : ""
		}${tag ? ` tags/${tag}` : ""}${
			tracking ? ` upstream/${tracking}` : ""
		}`;

		return runCommand(
			logMessage && logMessage.length
				? { args, showOutput, logMessage, spinner, repo, onError }
				: { args, showOutput, spinner, repo, onError }
		);
	},

	checkout({
		branch,
		option,
		tag,
		tracking,
		remote = "upstream",
		spinner,
		repo,
		failHelpKey,
		onError
	}) {
		const args = `checkout${option ? ` ${option}` : ""} ${branch}${
			tag ? ` ${tag}` : ""
		}${tracking ? ` ${remote}/${tracking}` : ""}`;

		return runCommand(
			failHelpKey && failHelpKey.length
				? { args, failHelpKey, spinner, repo, onError }
				: { args, spinner, repo, onError }
		).then(() => {
			return getCurrentBranch();
		});
	},

	commit({ option = "-m", comment, spinner, repo }) {
		const args = `commit ${option} "${comment}"`;
		return runCommand({ args, spinner, repo });
	},

	config({ remote, showOutput = false, spinner, repo }) {
		const args = `config remote.${remote}.url`;
		return runCommand({ args, spinner, repo, showOutput });
	},

	diff({
		option = "--color",
		files,
		branch = "",
		remote = "upstream",
		glob,
		maxBuffer,
		logMessage,
		spinner,
		repo,
		failHelpKey,
		exitOnFail,
		showError,
		onError
	}) {
		const args = `diff ${option}${files ? ` ${files.join(" ")}` : ""}${
			branch ? ` ${remote}/${branch}` : `${branch}`
		}${glob ? ` -- ${glob}` : ""}`;
		return runCommand({
			args,
			maxBuffer,
			spinner,
			repo,
			logMessage,
			failHelpKey,
			exitOnFail,
			showError,
			onError
		});
	},

	fetch({ spinner, repo, failHelpKey }) {
		const args = `fetch upstream --tags`;
		return runCommand(
			failHelpKey && failHelpKey.length
				? { args, spinner, repo, failHelpKey }
				: { args, spinner, repo }
		);
	},

	log({ option, branch, remote, spinner, repo }) {
		const args = `log${option ? ` ${option}` : ""}${
			branch ? ` ${branch}` : ""
		}${remote ? `..${remote}` : ""}`;
		return runCommand({ args, spinner, repo });
	},

	merge({
		branch,
		remote,
		fastForwardOnly = true,
		spinner,
		repo,
		failHelpKey
	}) {
		const args = `merge ${remote ? `${remote}/${branch}` : `${branch}`}${
			fastForwardOnly ? " --ff-only" : " --no-ff"
		}`;
		return runCommand(
			failHelpKey && failHelpKey.length
				? { args, spinner, repo, failHelpKey }
				: { args, spinner, repo }
		);
	},

	push({
		branch,
		option,
		remote,
		base,
		tag,
		logMessage,
		spinner,
		repo,
		failHelpKey,
		onError
	}) {
		const args = `push ${option ? `${option} ` : ""}${remote} ${
			base ? `${base}:${branch}` : `${branch}`
		}${tag ? ` refs/tags/${tag}` : ""}`;
		return runCommand(
			failHelpKey && failHelpKey.length
				? { args, failHelpKey, logMessage, spinner, repo, onError }
				: { args, logMessage, spinner, repo, onError }
		);
	},

	rebase({
		branch,
		remote = "upstream",
		failHelpKey,
		exitOnFail = true,
		onError
	}) {
		const args = `rebase ${remote}/${branch} --preserve-merges`;
		return runCommand(
			failHelpKey && failHelpKey.length
				? { args, failHelpKey, exitOnFail, onError }
				: { args, exitOnFail, onError }
		);
	},

	remote() {
		const args = "remote";
		return runCommand({ args });
	},

	stash() {
		const args = "stash --include-untracked";
		return runCommand({
			args,
			logMessage: "stashing uncommitted changes"
		});
	},

	status({ showOutput }) {
		const args = "status";
		return runCommand({ args, showOutput });
	},

	tag({ tag, annotation, spinner, repo }) {
		const args = `tag -a ${tag} -m ${annotation || tag}`;
		return runCommand({ args, spinner, repo });
	}
};

module.exports = git;
