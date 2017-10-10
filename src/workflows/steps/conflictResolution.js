import git from "../../git";
import util from "../../utils";
import logger from "better-console";
import chalk from "chalk";
import { remove } from "lodash";

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

	Object.keys(chunks).forEach(key => {
		const chunk = chunks[key];
		const index = chunk.findIndex(item => item.includes(MIDDLE_MARKER));
		const local = chunk.slice(index + 1);
		Object.keys(localChanges).forEach(change => {
			remove(local, l => l.includes(change));
		});

		local.forEach(item => {
			const [, pkg, version] = /"@lk\/([\w-]+)": "([\d.]+)"/.exec(item) || [];
			localChanges[pkg] = version;
		});

		chunk.splice(index);
	});

	state.cr = Object.assign({}, state.cr, {
		chunks
	});
};

export function getLocalChanges(state) {
	const { dependencies } = state;

	// creates an object of the changes you made to the package.json
	// for the pre-releases.
	const localChanges = dependencies.reduce((result, dep) => {
		result[dep.pkg] = dep.version;
		return result;
	}, {});

	state.cr.localChanges = localChanges;
}

export function findConflictedPackageJSONChunks(state) {
	const { configPath, cr: { localChanges } } = state;
	const contents = util.readFile(configPath);

	const chunks = retrieveAndRemoveConflictedSectionsFromContents(
		contents,
		state
	);
	createChunksToBeInserted(chunks, localChanges, state);
}

export function resolveChunkConflicts(state) {
	const { scope, cr: { chunks, localChanges } } = state;
	// updates chunk object	to reflect how the chunk should look
	// when inserted back into the package.json to resolve conflicts.
	Object.keys(chunks).forEach(key => {
		const chunk = chunks[key];
		Object.keys(localChanges).forEach(localKey => {
			if (localChanges[localKey].includes("-")) {
				const newKey = `"${scope}/${localKey}"`;
				const index = chunk.findIndex(item => item.includes(newKey));
				if (index > -1) {
					// eslint-disable-line no-magic-numbers
					chunk[index] = chunk[index].replace(
						/^(\s*".+": ")[\d.]+(".*)$/,
						`$1${localChanges[localKey]}$2`
					);
				}
			} else {
				chunk.forEach(line => {
					if (line.includes(localKey)) {
						const [, , version] =
							/"@lk\/([\w-]+)": "([\d.]+)"/.exec(line) || [];
						logger.log(
							`${chalk.white.bold(
								`You had a local change of`
							)} ${chalk.yellow.bold(
								`${localChanges[localKey]}`
							)} ${chalk.white.bold(`for`)} ${chalk.yellow.bold(
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
}

export function writeChunksToPackageJSON(state) {
	let { cr: { contents } } = state;
	const { configPath, cr: { chunks, newLines } } = state;

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
}

export function gitRebaseUpstreamDevelopWithConflictFlag(state) {
	const onError = () => {
		return () =>
			git.status(false).then(response => {
				if (response.includes("package.json")) {
					return Promise.resolve({ conflict: true });
				}
				return Promise.reject();
			});
	};

	return git.rebaseUpstreamDevelop({ onError }).then(response => {
		const { conflict } = response;
		state.conflict = conflict;
		return Promise.resolve(state.conflict);
	});
}

export function resolvePackageJSONConflicts(state) {
	if (state.conflict) {
		state.cr = {};
		getLocalChanges(state);
		findConflictedPackageJSONChunks(state);
		resolveChunkConflicts(state);
		writeChunksToPackageJSON(state);
	}
	return Promise.resolve();
}

export function verifyConflictResolution() {
	return git.checkConflictMarkers();
}
