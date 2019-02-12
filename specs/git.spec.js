const git = require("../src/git");
const runCommand = require("../src/helpers/runCommand");
const getCurrentBranch = require("../src/helpers/getCurrentBranch");

jest.mock("../src/helpers/runCommand", () => jest.fn(() => Promise.resolve()));
jest.mock("../src/helpers/getCurrentBranch");

describe("git", () => {
	let branch, onError;
	beforeEach(() => {
		branch = "feature-branch";
		onError = jest.fn();
	});

	describe("add", () => {
		let files;
		beforeEach(() => {
			files = ["./package.json"];
		});

		it("should call add", () => {
			git.add({});
			expect(runCommand).toHaveBeenCalledTimes(1);
			expect(runCommand).toHaveBeenCalledWith({
				args: "add "
			});
		});

		it("should call add with files", () => {
			git.add({ files });
			expect(runCommand).toHaveBeenCalledTimes(1);
			expect(runCommand).toHaveBeenCalledWith({
				args: "add ./package.json"
			});
		});

		it("should call add with files and option", () => {
			git.add({ option: "-u", files });
			expect(runCommand).toHaveBeenCalledTimes(1);
			expect(runCommand).toHaveBeenCalledWith({
				args: "add -u ./package.json"
			});
		});
	});

	describe("branch", () => {
		let showOutput;
		beforeEach(() => {
			showOutput = true;
		});

		it("should call branch", () => {
			git.branch({ showOutput, onError });
			expect(runCommand).toHaveBeenCalledTimes(1);
			expect(runCommand).toHaveBeenCalledWith({
				args: "branch",
				showOutput,
				onError
			});
		});

		it("should call branch with branch", () => {
			git.branch({ branch, showOutput, onError });
			expect(runCommand).toHaveBeenCalledTimes(1);
			expect(runCommand).toHaveBeenCalledWith({
				args: "branch feature-branch",
				showOutput,
				onError
			});
		});

		it("should call branch with opiton", () => {
			git.branch({ branch, option: "-r", showOutput, onError });
			expect(runCommand).toHaveBeenCalledTimes(1);
			expect(runCommand).toHaveBeenCalledWith({
				args: "branch -r feature-branch",
				showOutput,
				onError
			});
		});

		it("should call branch with tag", () => {
			git.branch({ branch, tag: "v1.0.0-pre", showOutput, onError });
			expect(runCommand).toHaveBeenCalledTimes(1);
			expect(runCommand).toHaveBeenCalledWith({
				args: "branch feature-branch tags/v1.0.0-pre",
				showOutput,
				onError
			});
		});

		it("should call branch with tracking", () => {
			git.branch({
				branch,
				tracking: "another-branch",
				showOutput,
				onError
			});
			expect(runCommand).toHaveBeenCalledTimes(1);
			expect(runCommand).toHaveBeenCalledWith({
				args: "branch feature-branch upstream/another-branch",
				showOutput,
				onError
			});
		});

		it("should call branch with appropriate args", () => {
			git.branch({
				branch,
				option: "-r",
				tag: "v1.0.0-pre",
				tracking: "another-branch",
				showOutput,
				logMessage: "some message to display",
				onError
			});
			expect(runCommand).toHaveBeenCalledTimes(1);
			expect(runCommand).toHaveBeenCalledWith({
				args:
					"branch -r feature-branch tags/v1.0.0-pre upstream/another-branch",
				showOutput,
				logMessage: "some message to display",
				onError
			});
		});
	});

	describe("checkout", () => {
		it("should checkout branch", () => {
			git.checkout({ branch, onError });
			expect(runCommand).toHaveBeenCalledTimes(1);
			expect(runCommand).toHaveBeenCalledWith({
				args: "checkout feature-branch",
				onError
			});
		});

		it("should checkout branch with option", () => {
			git.checkout({ branch, option: "-b", onError });
			expect(runCommand).toHaveBeenCalledTimes(1);
			expect(runCommand).toHaveBeenCalledWith({
				args: "checkout -b feature-branch",
				onError
			});
		});

		it("should checkout branch with tag", () => {
			git.checkout({ branch, tag: "v1.0.0-pre", onError });
			expect(runCommand).toHaveBeenCalledTimes(1);
			expect(runCommand).toHaveBeenCalledWith({
				args: "checkout feature-branch v1.0.0-pre",
				onError
			});
		});

		it("should checkout branch with tracking", () => {
			git.checkout({ branch, tracking: "tracking-branch", onError });
			expect(runCommand).toHaveBeenCalledTimes(1);
			expect(runCommand).toHaveBeenCalledWith({
				args: "checkout feature-branch upstream/tracking-branch",
				onError
			});
		});

		it("should checkout branch with option and tag", () => {
			git.checkout({ branch, option: "-b", tag: "v1.0.0-pre", onError });
			expect(runCommand).toHaveBeenCalledTimes(1);
			expect(runCommand).toHaveBeenCalledWith({
				args: "checkout -b feature-branch v1.0.0-pre",
				onError
			});
		});

		it("should pass failHelpKey when provided", () => {
			git.checkout({ branch, failHelpKey: "failureKey", onError });
			expect(runCommand).toHaveBeenCalledTimes(1);
			expect(runCommand).toHaveBeenCalledWith({
				args: "checkout feature-branch",
				failHelpKey: "failureKey",
				onError
			});
		});

		it("should call getCurrentBranch when successful", async () => {
			await git.checkout({ branch });
			expect(getCurrentBranch).toHaveBeenCalledTimes(1);
		});
	});

	describe("commit", () => {
		it("should call commit", () => {
			git.commit({});
			expect(runCommand).toHaveBeenCalledTimes(1);
			expect(runCommand).toHaveBeenCalledWith({
				args: `commit -m "undefined"`
			});
		});

		it("should call commit with option", () => {
			git.commit({ option: "--amend -m" });
			expect(runCommand).toHaveBeenCalledTimes(1);
			expect(runCommand).toHaveBeenCalledWith({
				args: `commit --amend -m "undefined"`
			});
		});

		it("should call commit with comment", () => {
			git.commit({ comment: "my comment" });
			expect(runCommand).toHaveBeenCalledTimes(1);
			expect(runCommand).toHaveBeenCalledWith({
				args: `commit -m "my comment"`
			});
		});
	});

	describe("config", () => {
		it("should call config", () => {
			git.config({});
			expect(runCommand).toHaveBeenCalledTimes(1);
			expect(runCommand).toHaveBeenCalledWith({
				args: "config remote.undefined.url",
				showOutput: false
			});
		});

		it("should call config with remote", () => {
			git.config({ remote: "origin" });
			expect(runCommand).toHaveBeenCalledTimes(1);
			expect(runCommand).toHaveBeenCalledWith({
				args: "config remote.origin.url",
				showOutput: false
			});
		});

		it("should call config with appropriate args", () => {
			git.config({ remote: "origin", showOutput: true });
			expect(runCommand).toHaveBeenCalledTimes(1);
			expect(runCommand).toHaveBeenCalledWith({
				args: "config remote.origin.url",
				showOutput: true
			});
		});
	});

	describe("diff", () => {
		it("should call diff", () => {
			git.diff({});
			expect(runCommand).toHaveBeenCalledTimes(1);
			expect(runCommand).toHaveBeenCalledWith({
				args: "diff --color"
			});
		});

		it("should call diff with option", () => {
			git.diff({ option: "--check" });
			expect(runCommand).toHaveBeenCalledTimes(1);
			expect(runCommand).toHaveBeenCalledWith({
				args: "diff --check"
			});
		});

		it("should call diff with files", () => {
			git.diff({ files: ["./package.json"] });
			expect(runCommand).toHaveBeenCalledTimes(1);
			expect(runCommand).toHaveBeenCalledWith({
				args: "diff --color ./package.json"
			});
		});

		it("should call diff with appropriate args", () => {
			git.diff({
				option: "--check",
				files: ["./package.json"],
				maxBuffer: 5000,
				logMessage: "some message",
				failHelpKey: "failureKey",
				showError: true,
				onError
			});
			expect(runCommand).toHaveBeenCalledTimes(1);
			expect(runCommand).toHaveBeenCalledWith({
				args: "diff --check ./package.json",
				maxBuffer: 5000,
				logMessage: "some message",
				failHelpKey: "failureKey",
				showError: true,
				onError
			});
		});
	});

	describe("fetch", () => {
		it("should call fetch", () => {
			git.fetch({});
			expect(runCommand).toHaveBeenCalledTimes(1);
			expect(runCommand).toHaveBeenCalledWith({
				args: "fetch upstream --tags"
			});
		});

		it("should call fetch", () => {
			git.fetch({ failHelpKey: "failureKey" });
			expect(runCommand).toHaveBeenCalledTimes(1);
			expect(runCommand).toHaveBeenCalledWith({
				args: "fetch upstream --tags",
				failHelpKey: "failureKey"
			});
		});
	});

	describe("merge", () => {
		it("should call merge", () => {
			git.merge({});
			expect(runCommand).toHaveBeenCalledTimes(1);
			expect(runCommand).toHaveBeenCalledWith({
				args: "merge undefined --ff-only"
			});
		});

		it("should call merge with branch", () => {
			git.merge({ branch });
			expect(runCommand).toHaveBeenCalledTimes(1);
			expect(runCommand).toHaveBeenCalledWith({
				args: "merge feature-branch --ff-only"
			});
		});

		it("should call merge with remote", () => {
			git.merge({ remote: "origin" });
			expect(runCommand).toHaveBeenCalledTimes(1);
			expect(runCommand).toHaveBeenCalledWith({
				args: "merge origin/undefined --ff-only"
			});
		});

		it("should call merge with appropriate args", () => {
			git.merge({
				branch,
				remote: "origin",
				fastForwardOnly: false,
				failHelpKey: "failureKey"
			});
			expect(runCommand).toHaveBeenCalledTimes(1);
			expect(runCommand).toHaveBeenCalledWith({
				args: "merge origin/feature-branch --no-ff",
				failHelpKey: "failureKey"
			});
		});
	});

	describe("push", () => {
		it("should call push", () => {
			git.push({});
			expect(runCommand).toHaveBeenCalledTimes(1);
			expect(runCommand).toHaveBeenCalledWith({
				args: "push undefined undefined"
			});
		});

		it("should call push with branch", () => {
			git.push({ branch });
			expect(runCommand).toHaveBeenCalledTimes(1);
			expect(runCommand).toHaveBeenCalledWith({
				args: "push undefined feature-branch"
			});
		});

		it("should call push with option", () => {
			git.push({ option: "-f" });
			expect(runCommand).toHaveBeenCalledTimes(1);
			expect(runCommand).toHaveBeenCalledWith({
				args: "push -f undefined undefined"
			});
		});

		it("should call push with remote", () => {
			git.push({ remote: "origin" });
			expect(runCommand).toHaveBeenCalledTimes(1);
			expect(runCommand).toHaveBeenCalledWith({
				args: "push origin undefined"
			});
		});

		it("should call push with base", () => {
			git.push({ base: "develop" });
			expect(runCommand).toHaveBeenCalledTimes(1);
			expect(runCommand).toHaveBeenCalledWith({
				args: "push undefined develop:undefined"
			});
		});

		it("should call push with tag", () => {
			git.push({ tag: "v1.0.0-pre" });
			expect(runCommand).toHaveBeenCalledTimes(1);
			expect(runCommand).toHaveBeenCalledWith({
				args: "push undefined undefined refs/tags/v1.0.0-pre"
			});
		});

		it("should call push with appropriate args", () => {
			git.push({
				branch,
				option: "-f",
				remote: "origin",
				base: "develop",
				tag: "v1.0.0-pre",
				logMessage: "some message",
				failHelpKey: "failureKey",
				onError
			});
			expect(runCommand).toHaveBeenCalledTimes(1);
			expect(runCommand).toHaveBeenCalledWith({
				args:
					"push -f origin develop:feature-branch refs/tags/v1.0.0-pre",
				logMessage: "some message",
				failHelpKey: "failureKey",
				onError
			});
		});
	});

	describe("rebase", () => {
		it("should call rebase", () => {
			git.rebase({});
			expect(runCommand).toHaveBeenCalledTimes(1);
			expect(runCommand).toHaveBeenCalledWith({
				args: "rebase upstream/undefined --preserve-merges",
				exitOnFail: true
			});
		});

		it("should call rebase with branch", () => {
			git.rebase({ branch });
			expect(runCommand).toHaveBeenCalledTimes(1);
			expect(runCommand).toHaveBeenCalledWith({
				args: "rebase upstream/feature-branch --preserve-merges",
				exitOnFail: true
			});
		});

		it("should call rebase with remote", () => {
			git.rebase({ remote: "origin" });
			expect(runCommand).toHaveBeenCalledTimes(1);
			expect(runCommand).toHaveBeenCalledWith({
				args: "rebase origin/undefined --preserve-merges",
				exitOnFail: true
			});
		});

		it("should call rebase with appropriate args", () => {
			git.rebase({
				branch,
				remote: "origin",
				failHelpKey: "failureKey",
				exitOnFail: false,
				onError
			});
			expect(runCommand).toHaveBeenCalledTimes(1);
			expect(runCommand).toHaveBeenCalledWith({
				args: "rebase origin/feature-branch --preserve-merges",
				failHelpKey: "failureKey",
				exitOnFail: false,
				onError
			});
		});
	});

	describe("remote", () => {
		it("should call remote", () => {
			git.remote();
			expect(runCommand).toHaveBeenCalledTimes(1);
			expect(runCommand).toHaveBeenCalledWith({
				args: "remote"
			});
		});
	});

	describe("stash", () => {
		it("should call stash with appropriate args", () => {
			git.stash();
			expect(runCommand).toHaveBeenCalledTimes(1);
			expect(runCommand).toHaveBeenCalledWith({
				args: "stash --include-untracked",
				logMessage: "stashing uncommitted changes"
			});
		});
	});

	describe("status", () => {
		it("should call status", () => {
			git.status({});
			expect(runCommand).toHaveBeenCalledTimes(1);
			expect(runCommand).toHaveBeenCalledWith({
				args: "status"
			});
		});

		it("should call status with appropriate args", () => {
			git.status({ showOutput: false });
			expect(runCommand).toHaveBeenCalledTimes(1);
			expect(runCommand).toHaveBeenCalledWith({
				args: "status",
				showOutput: false
			});
		});
	});

	describe("tag", () => {
		it("should call tag", () => {
			git.tag({});
			expect(runCommand).toHaveBeenCalledTimes(1);
			expect(runCommand).toHaveBeenCalledWith({
				args: "tag -a undefined -m undefined"
			});
		});

		it("should call tag with tag", () => {
			git.tag({ tag: "v1.0.0-pre" });
			expect(runCommand).toHaveBeenCalledTimes(1);
			expect(runCommand).toHaveBeenCalledWith({
				args: "tag -a v1.0.0-pre -m v1.0.0-pre"
			});
		});

		it("should call tag with annotation", () => {
			git.tag({ annotation: "annotation" });
			expect(runCommand).toHaveBeenCalledTimes(1);
			expect(runCommand).toHaveBeenCalledWith({
				args: "tag -a undefined -m annotation"
			});
		});

		it("should call tag with appropriate args", () => {
			git.tag({ tag: "v1.0.0-pre", annotation: "annotation" });
			expect(runCommand).toHaveBeenCalledTimes(1);
			expect(runCommand).toHaveBeenCalledWith({
				args: "tag -a v1.0.0-pre -m annotation"
			});
		});
	});
});
