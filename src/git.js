const runCommand = require("./helpers/runCommand");
const getCurrentBranch = require("./helpers/getCurrentBranch");

const git = {
	add({ option, files = [] }) {
		const args = `add${option ? ` ${option}` : ""} ${files.join(" ")}`;
		return runCommand({ args });
	},

	branch({ branch, option, tag, tracking, showOutput, logMessage, onError }) {
		const args = `branch${option ? ` ${option}` : ""}${
			branch ? ` ${branch}` : ""
		}${tag ? ` tags/${tag}` : ""}${
			tracking ? ` upstream/${tracking}` : ""
		}`;

		return runCommand(
			logMessage && logMessage.length
				? { args, showOutput, logMessage, onError }
				: { args, showOutput, onError }
		);
	},

	checkout({
		branch,
		option,
		tag,
		tracking,
		remote = "upstream",
		failHelpKey,
		onError
	}) {
		const args = `checkout${option ? ` ${option}` : ""} ${branch}${
			tag ? ` ${tag}` : ""
		}${tracking ? ` ${remote}/${tracking}` : ""}`;

		return runCommand(
			failHelpKey && failHelpKey.length
				? { args, failHelpKey, onError }
				: { args, onError }
		).then(() => {
			return getCurrentBranch();
		});
	},

	commit({ option = "-m", comment }) {
		const args = `commit ${option} "${comment}"`;
		return runCommand({ args });
	},

	config({ remote, showOutput = false }) {
		const args = `config remote.${remote}.url`;
		return runCommand({ args, showOutput });
	},

	diff({
		option = "--color",
		files,
		maxBuffer,
		logMessage,
		failHelpKey,
		exitOnFail,
		showError,
		onError
	}) {
		const args = `diff ${option}${files ? ` ${files.join(" ")}` : ""}`;
		return runCommand({
			args,
			maxBuffer,
			logMessage,
			failHelpKey,
			exitOnFail,
			showError,
			onError
		});
	},

	fetch({ failHelpKey }) {
		const args = `fetch upstream --tags`;
		return runCommand(
			failHelpKey && failHelpKey.length ? { args, failHelpKey } : { args }
		);
	},

	merge({ branch, remote, fastForwardOnly = true, failHelpKey }) {
		const args = `merge ${remote ? `${remote}/${branch}` : `${branch}`}${
			fastForwardOnly ? " --ff-only" : " --no-ff"
		}`;
		return runCommand(
			failHelpKey && failHelpKey.length ? { args, failHelpKey } : { args }
		);
	},

	push({
		branch,
		option,
		remote,
		base,
		tag,
		logMessage,
		failHelpKey,
		onError
	}) {
		const args = `push ${option ? `${option} ` : ""}${remote} ${
			base ? `${base}:${branch}` : `${branch}`
		}${tag ? ` refs/tags/${tag}` : ""}`;
		return runCommand(
			failHelpKey && failHelpKey.length
				? { args, failHelpKey, logMessage, onError }
				: { args, logMessage, onError }
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

	tag({ tag, annotation }) {
		const args = `tag -a ${tag} -m ${annotation || tag}`;
		return runCommand({ args });
	}
};

module.exports = git;
