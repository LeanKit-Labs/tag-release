#!/usr/bin/env node
/* eslint-disable max-statements */
const commander = require("commander");
const api = require("../src/index.js");
const workflow = require("../src/workflows/l10n");
const l10nDry = require("../src/workflows/l10n-dry");
const qaAuto = require("../src/workflows/qa-automated");
const utils = require("../src/utils.js");
const steps = require("../src/workflows/steps/index");
const { remove, findIndex, clone, map, filter, forEach } = require("lodash");
const Table = require("cli-table2");
const path = require("path");
const { rootDirectory, repos } = require(path.join(
	process.env.TR_DIRECTORY,
	"./.tag-releaserc.json"
));
let preReleaseFlow = require("../src/workflows/pre-release");
const filterFlowBasedOnDevelopBranch = require("../src/helpers/filterFlowBasedOnDevelopBranch");
const runWorkflow = require("../src/helpers/runWorkflow");
const ora = require("ora");

process.env.NO_OUTPUT = true;

utils.applyCommanderOptions(commander);
commander.option(
	"--check",
	"check if there are changes in the repos before you actually run the tool"
);

commander.parse(process.argv);

const { verbose, maxbuffer, check } = commander;

const outputResults = arr => {
	const table = new Table({
		head: ["repo", "branch", "tag", "status"]
	});
	forEach(arr, ({ repo, branch, tag, status }) => {
		table.push([repo, branch, tag, status]);
	});
	console.log(table.toString()); // eslint-disable-line no-console
};

const saveState = (options, item) => {
	const [repo] = Object.keys(item.value);
	// if we are doing a dry-run we only care if there were changes or not.
	if (check) {
		options.status = options.hasChanges ? "changes" : "no changes";
	} else {
		options.status =
			options.status === "skipped" ? options.status : "completed";
	}
	options.l10n.push({
		repo,
		branch: options.branch,
		tag: options.tag,
		status: options.status,
		private: options.private
	});
};

const getNextState = (options, item) => {
	const [repo] = Object.keys(item.value);

	options.branch = item.value[repo];
	options.cwd = `${rootDirectory}/${repo}`;
	options.spinner = ora(repo);
	options.tag = "";
	options.hasChanges = false;
};

let iterator = repos[Symbol.iterator]();
let item = iterator.next();
const callback = async options => {
	let flow;
	if (options.hasChanges) {
		await steps.checkoutl10nBranch(options);

		// if the branch already existed, we need to just skip the release.
		if (options.status !== "skipped") {
			options.hasChanges = false;

			// check if we are dealing with a private repo (host project)
			if (utils.isPackagePrivate(options.configPath)) {
				options.private = true;
				options.status = "skipped";
				return callback(options);
			}

			// remove steps that aren't required for automated run
			preReleaseFlow = remove(preReleaseFlow, step => {
				return (
					step !== steps.previewLog &&
					step !== steps.gitDiff &&
					step !== steps.gitMergeUpstreamBranch
				);
			});

			flow = filterFlowBasedOnDevelopBranch(options, preReleaseFlow);
			return runWorkflow(flow, options);
		}
	}

	saveState(options, item);
	options.spinner.succeed();

	item = iterator.next();
	if (item.done) {
		// check if any repos were private
		const privateIndex = findIndex(options.l10n, { private: true });
		if (privateIndex !== -1) {
			options.spinner = ora("creating qa branch").start();
			const { repo: pRepo } = options.l10n[privateIndex];
			let l10nClone = clone(options.l10n);

			options.cwd = `${rootDirectory}/${pRepo}`;
			l10nClone = filter(l10nClone, i => {
				return !i.private && i.tag;
			});
			options.dependencies = map(l10nClone, dep => {
				return {
					pkg: dep.repo,
					version: dep.tag.substr(
						dep.tag.indexOf("v") + 1,
						dep.tag.length
					)
				};
			});
			options.changeReason = "Updated l10n translations".replace(
				/["]+/g,
				""
			);
			options.callback = () => {};

			await runWorkflow(qaAuto, options);
			options.l10n[privateIndex].status = "completed";
			options.spinner.succeed();
		}

		outputResults(options.l10n);

		return Promise.resolve();
	}

	getNextState(options, item);
	options.spinner.start();
	flow = filterFlowBasedOnDevelopBranch(options, workflow);

	return runWorkflow(flow, options);
};

const dry = options => {
	saveState(options, item);
	options.spinner.succeed();

	item = iterator.next();
	if (item.done) {
		outputResults(options.l10n);

		return Promise.resolve();
	}

	getNextState(options, item);
	options.spinner.start();

	return runWorkflow(l10nDry, options);
};

const [repo] = Object.keys(item.value);
const today = new Date();
const currentMonth = today
	.toLocaleString("en-us", { month: "short" })
	.toLowerCase();
const options = {
	verbose,
	maxbuffer,
	workflow: check ? l10nDry : workflow,
	cwd: `${rootDirectory}/${repo}`, // directory to be running tag-release in (cwd-current working directory)
	branch: item.value[repo],
	callback: check ? dry : callback,
	command: "l10n",
	prerelease: `l10n-${currentMonth}-${today.getDate()}`, // used for pre-release identifier
	release: "preminor", // used for release type,
	releaseName: "Updated l10n translations", // name to be used for pre-release,
	status: "pending",
	private: false,
	spinner: ora(repo),
	l10n: []
};

options.spinner.start();
api.cli(options);
