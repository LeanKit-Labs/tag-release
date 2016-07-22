# `tag-release`

## Usage

### No Flags

You will be prompted for information regarding what type of update you are
making (major, minor, patch). Along the way, you'll have the opportunity to
verify, modify, or cancel the `tag-release` process.

```
$ tag-release

? What is your GitHub username
? What is your GitHub password
? What type of release is this (Use arrow keys)
❯ Major (Breaking Change)
  Minor (New Feature)
  Patch (Bug Fix)
etc...
```

### With Flags

```
$ tag-release --help
$ tag-release -h

Usage: tag-release [options]

Options:

	-h, --help            output usage information
	-r, --release [type]  Release type (major, minor, patch)
	-v, --verbose         Console additional information

Examples:

	$ tag-release
	$ tag-release --release major
	$ tag-release -r minor
	$ tag-release --verbose
	$ tag-release -v
```

### GitHub Integration

You will only be asked for your GitHub **username** and **password** when you first
start using `tag-release` (and also **authentication code** if you have 2FA
enabled). It will generate an authorization token with GitHub and store that in
your global git configuration for later usage.

```
# get the configs
git config --global tag-release.username
git config --global tag-release.token

# edit the configs
git config --global --edit

# unset the configs
git config --global --unset tag-release.username
git config --global --unset tag-release.token
```

Using the `--verbose` or `-v` flag will output your `username` and `token`
information.

```
$ tag-release -v
--- GitHub Configuration ------------------------------------------------------
username             : johndoe
token                : a92282731316b2d4f2313ff64b1350b78a5d4cf6
-------------------------------------------------------------------------------
? What type of release is this (Use arrow keys)
❯ Major (Breaking Change)
 Minor (New Feature)
 Patch (Bug Fix)
```

## What Does That Error Mean!?!

> Click the following errors to reveal an explanation of what the error means and a proposed solution

<details>
	<summary>Potentially unhandled rejection [21] Error: Command failed: git fetch upstream --tags</summary>
	You don't have an `upstream` set for your repository. You can add an upstream
	with the following command `git remote add upstream https://github.com/[upstream-owner]/[repo-name].git`
</details>

<details>
	<summary>Error: Command failed: "npm publish"</summary>
	You may have not authenticated with npm on your machine yet. You can do so
	with the following command `npm adduser`.
</details>

<details>
	<summary>Potentially unhandled rejection [8] Error: Command failed: "git push upstream master --tags"</summary>
	If you have GitHub Two Factor Authentication enabled and you are prompted for
	your password when `tag-release` tries to push code then you'll need to use
	your GitHub `token` as your password. If you use the `--verbose` flag when
	running `tag-release` it'll log your token to the console.
</details>
