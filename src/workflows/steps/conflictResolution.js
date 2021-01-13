const command = require("../../command");
const git = require("../../git");
const util = require("../../utils");
const logger = require("better-console");
const chalk = require("chalk");
const { remove } = require("lodash");

const retrieveAndRemoveConflictedSectionsFromContents = (contents, state) => {
	const LEFT_MARKER = "<<<<<<<";
	const RIGHT_MARKER = ">>>>>>>";
	let conflictMarker = null;
	const chunks = {};

	const lines = contents.split("\n");
	const newLines = lines.reduce((memo, line, index) => {
		if (line.includes(LEFT_MARKER)) {
			conflictMarker = lines[index - 1];
			chunks[conflictMarker] = [];
		} else if (conflictMarker) {
			if (line.includes(RIGHT_MARKER)) {
				conflictMarker = null;
			} else {
				chunks[conflictMarker].push(line);
			}
		} else {
			memo.push(line);
		}

		return memo;
	}, []);

	state.cr = Object.assign({}, state.cr, {
		newLines,
		contents
	});

	return chunks;
};

const createChunksToBeInserted = (chunks, localChanges, state) => {
	const MIDDLE_MARKER = "=======";

	const { scope } = state;
	const r2 = new RegExp(`"${scope}\\/([\\w-]+)": "(\\^?[\\d.]+)"`);
	Object.keys(chunks).forEach(key => {
		const chunk = chunks[key];
		const index = chunk.findIndex(item => item.includes(MIDDLE_MARKER));
		const local = chunk.slice(index + 1);
		Object.keys(localChanges).forEach(change => {
			remove(local, l => l.includes(change));
		});

		local.forEach(item => {
			const [, pkg, version] = r2.exec(item) || [];
			localChanges[pkg] = version;
		});

		chunk.splice(index);
	});

	state.cr = Object.assign({}, state.cr, {
		chunks
	});
};

const api = {
	getLocalChanges(state) {
		const { dependencies } = state;

		// creates an object of the changes you made to the package.json
		// for the pre-releases.
		const localChanges = dependencies.reduce((result, dep) => {
			result[dep.pkg] = dep.version;
			return result;
		}, {});

		state.cr.localChanges = localChanges;
	},
	findConflictedPackageJSONChunks(state) {
		const { filePaths: { configPath }, cr: { localChanges } } = state;
		const contents = util.readFile(configPath);

		const chunks = retrieveAndRemoveConflictedSectionsFromContents(
			contents,
			state
		);
		createChunksToBeInserted(chunks, localChanges, state);
	},
	resolveChunkConflicts(state) {
		const { scope, cr: { chunks, localChanges } } = state;
		// updates chunk object	to reflect how the chunk should look
		// when inserted back into the package.json to resolve conflicts.
		Object.keys(chunks).forEach(key => {
			const chunk = chunks[key];
			Object.keys(localChanges).forEach(localKey => {
				if (localChanges[localKey].includes("-")) {
					const newKey = `"${scope}/${localKey}"`;
					const index = chunk.findIndex(item =>
						item.includes(newKey)
					);
					if (index > -1) {
						// eslint-disable-line no-magic-numbers
						chunk[index] = chunk[index].replace(
							/^(\s*".+": ")[\d.]+(".*)$/,
							`$1${localChanges[localKey]}$2`
						);
					}
				} else {
					const r2 = new RegExp(
						`"${scope}\\/([\\w-]+)": "(\\^?[\\d.]+)"`
					);
					chunk.forEach(line => {
						if (line.includes(localKey)) {
							const [, , version] = r2.exec(line) || [];
							logger.log(
								`${chalk.white.bold(
									`You had a local change of`
								)} ${chalk.yellow.bold(
									`${localChanges[localKey]}`
								)} ${chalk.white.bold(
									`for`
								)} ${chalk.yellow.bold(
									`${localKey}`
								)}${chalk.white.bold(
									`, but we used HEAD's version of`
								)} ${chalk.yellow.bold(`${version}`)}`
							);
						}
					});
				}
			});
		});

		state.cr.chunks = chunks;
	},
	writeChunksToPackageJSON(state) {
		let { cr: { contents } } = state;
		const { filePaths: { configPath }, cr: { chunks, newLines } } = state;

		// inserts chunks back into package.json to be writen to file
		Object.keys(chunks).forEach(key => {
			const chunk = chunks[key];
			newLines.forEach((line, index) => {
				if (line.includes(key)) {
					newLines.splice(index + 1, 0, ...chunk);
				}
			});
		});

		contents = newLines.join("\n");
		util.writeFile(configPath, contents);
	},
	gitRebaseUpstreamBaseWithConflictFlag(state) {
		const { hasDevelopBranch } = state;
		const onError = () => {
			return () =>
				git.status({ showOutput: false }).then(response => {
					if (response.includes("package.json")) {
						return Promise.resolve({ conflict: true });
					}
					util.advise("gitRebaseUpstreamBase");
				});
		};

		const call = hasDevelopBranch
			? () => command.rebaseUpstreamDevelop({ onError })
			: () => command.rebaseUpstreamMaster({ onError });

		return call().then(response => {
			const { conflict } = response;
			state.conflict = conflict;
			return Promise.resolve(state);
		});
	},
	resolvePackageJSONConflicts(state) {
		if (state.conflict) {
			state.cr = {};
			api.getLocalChanges(state);
			api.findConflictedPackageJSONChunks(state);
			api.resolveChunkConflicts(state);
			api.writeChunksToPackageJSON(state);
		}
		return Promise.resolve();
	},
	verifyConflictResolution() {
		return command.checkConflictMarkers();
	},
	retryRebase(err) {
		return git
			.diff({
				option: "--check",
				logMessage: "retrying rebase",
				failHelpKey: "gitRebaseUpstreamBase",
				exitOnFail: true
			})
			.then(() => command.rebaseContinue())
			.catch(() => Promise.reject(err));
	}
};

module.exports = api;
