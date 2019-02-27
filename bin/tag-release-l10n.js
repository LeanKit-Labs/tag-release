#!/usr/bin/env node
/* eslint-disable max-statements */
const commander = require("commander");
const api = require("../src/index.js");
const { sync, check: checkFlow } = require("../src/workflows/l10n");
const qaAuto = require("../src/workflows/qa-automated");
const utils = require("../src/utils.js");
const steps = require("../src/workflows/steps/index");
const { remove, findIndex, clone, map, filter, forEach } = require("lodash");
const Table = require("cli-table2");
const path = require("path");
const { rootDirectory, l10n = [] } = require(path.join(
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

const hasChanges = options => options.changes.locale || options.changes.dev;

const saveState = (options, item) => {
	const { repo } = item.value;
	options.l10n.push({
		repo,
		branch: options.branch,
		tag: options.tag,
		status: options.status,
		host: options.host,
		changes: options.changes
	});
};

const getNextState = (options, item, callback) => {
	options.tag = "";
	options.status = "pending";
	options.changes = {
		locale: false,
		dev: false
	};
	options.callback = callback;

	if (!item.done) {
		const { branch, repo, host } = item.value;
		options.branch = branch;
		options.cwd = `${rootDirectory}/${repo}`;
		options.spinner = ora(repo);
		options.host = host;
	}
};

const iterator = l10n[Symbol.iterator]();
let item = iterator.next();
const callback = async options => {
	let flow;
	if (hasChanges(options)) {
		await steps.checkoutl10nBranch(options);

		// if the branch already existed, we need to just skip the release.
		if (options.status !== "skipped") {
			// check if we are dealing with a private repo (host project)
			if (!utils.isPackagePrivate(options.configPath)) {
				// remove steps that aren't required for automated run
				preReleaseFlow = remove(preReleaseFlow, step => {
					return (
						step !== steps.previewLog &&
						step !== steps.gitDiff &&
						step !== steps.gitMergeUpstreamBranch
					);
				});

				options.callback = () => Promise.resolve();
				flow = filterFlowBasedOnDevelopBranch(options, preReleaseFlow);
				await runWorkflow(flow, options);
				options.status = "pre-released";
			}
		}
	}

	saveState(options, item);
	options.spinner.succeed();

	item = iterator.next();
	getNextState(options, item, callback);
	if (item.done) {
		// check if any repos were private
		const privateIndex = findIndex(options.l10n, { host: true });
		if (
			privateIndex !== -1 &&
			options.l10n[privateIndex].status !== "skipped"
		) {
			options.spinner = ora("creating qa branch").start();
			const { repo: pRepo } = options.l10n[privateIndex];
			let l10nClone = clone(options.l10n);

			options.cwd = `${rootDirectory}/${pRepo}`;
			l10nClone = filter(l10nClone, i => {
				return !i.host && i.tag;
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
			options.l10n[privateIndex].status = "qa bumped";
			options.spinner.succeed();
		}

		const table = new Table({
			head: ["repo", "branch", "tag", "status"]
		});
		forEach(options.l10n, ({ repo, branch, tag, status }) => {
			table.push([repo, branch, tag, status]);
		});
		console.log(table.toString()); // eslint-disable-line no-console

		return Promise.resolve();
	}

	options.spinner.start();
	flow = filterFlowBasedOnDevelopBranch(options, sync);

	return runWorkflow(flow, options);
};

const dry = options => {
	saveState(options, item);
	options.spinner.succeed();

	item = iterator.next();
	getNextState(options, item, dry);
	if (item.done) {
		const table = new Table({
			head: ["repo", "branch", "dev keys", "locale keys", "log diff"]
		});
		forEach(
			options.l10n,
			({ repo, branch, changes: { locale, dev, diff } }) => {
				const message = `${diff ? `${diff} commit(s)` : "up-to-date"}`;
				const devChanges = dev ? "changes" : "no changes";
				const localeChanges = locale ? "changes" : "no changes";
				table.push([repo, branch, devChanges, localeChanges, message]);
			}
		);
		console.log(table.toString()); // eslint-disable-line no-console

		return Promise.resolve();
	}

	options.spinner.start();
	return runWorkflow(checkFlow, options);
};

const { branch, repo, host } = item.value;
const today = new Date();
const currentMonth = today
	.toLocaleString("en-us", { month: "short" })
	.toLowerCase();
const options = {
	verbose,
	maxbuffer,
	workflow: check ? checkFlow : sync,
	cwd: `${rootDirectory}/${repo}`, // directory to be running tag-release in (cwd-current working directory)
	branch,
	callback: check ? dry : callback,
	command: "l10n",
	prerelease: `l10n-${currentMonth}-${today.getDate()}`, // used for pre-release identifier
	release: "preminor", // used for release type,
	releaseName: "Updated l10n translations", // name to be used for pre-release,
	status: "pending",
	host,
	spinner: ora(repo),
	l10n: [],
	changes: {
		locale: false,
		dev: false,
		diff: 0
	}
};

options.spinner.start();
api.cli(options);
