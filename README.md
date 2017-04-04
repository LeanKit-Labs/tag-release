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

  -h, --help                     Output usage information
  -r, --release [type]           Release type (major, minor, patch)
  --verbose                      Console additional information
  -v                             Console the version of tag-release
  -p, --prerelease               Create a pre-release
  -i, --identifier <identifier>  Identifier used for pre-release

Examples:

   $ tag-release
   $ tag-release --release major
   $ tag-release -r minor
   $ tag-release --verbose
   $ tag-release -v
   $ tag-release -p
   $ tag-release -p -i foo
```

### Pre-releases

Pre-releases are mainly for interim releases that are not intended for production use.
The benefit of this approach is being able to quickly deploy releases that can be easily
iterated upon. In order use this feature will you have to provide `tag-release` with the
`-p` or `--prerelease` command-line flag. Afterwards, you will be prompted for a identifier
(or you can provide the identifier on the command-line) that will be used in the pre-release tag.
Then the flow will continue as normal release.

Notes: When using the pre-release feature you should have an upstream feature branch with the same name.

```
Usage:
   $ tag-release -p
   $ tag-release --prerelease
   $ tag-release -p -i foo

Example:

   $ tag-release -p
   ? Pre-release Identifier: foo
   ? What type of release is this (Use arrow keys)
   ❯ Pre-major (Breaking Change)
     Pre-minor (New Feature)
     Pre-patch (Bug Fix)
     Pre-release (Bump existing Pre-release)
   etc...
```

Using the `-i` or `-identifier` command-line option will allow you to pass over the step
asking for the "Pre-release Indentifier".

```
Example:

   $ tag-release -p -i foo
   ? What type of release is this (Use arrow keys)
   ❯ Pre-major (Breaking Change)
     Pre-minor (New Feature)
     Pre-patch (Bug Fix)
     Pre-release (Bump existing Pre-release)
   etc...
```

These tags always match the following schema: [version]-[identifier].[bump]

| Latest Release | Latest Prerelease | Release | Pre-release   | Identifier    | Next Version   |
|----------------|-------------------|---------|---------------|---------------|----------------|
| 1.2.3          | N/A               | major   | yes           | pre (default) | 2.0.0-pre.0    |
| 1.2.3          | 2.0.0-pre.0       | major   | yes           | pre (default) | 2.0.0-pre.1    |
| 1.2.3          | 2.0.0-pre.1       | minor   | no            | N/A           | 1.3.0          |
| 1.3.0          | 2.0.0-pre.1       | minor   | yes           | filter        | 1.4.0-filter.0 |

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

Using the `--verbose` flag will output your `username` and `token`
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

## Frequently Asked Questions

> **Note**: Click the following items to reveal more information

<details>
	<summary>How can I tag a new repo as a `1.0.0` release?</summary>
	If your `package.json` version is already set to `1.0.0` tag-release will try to bump that version to either `2.0.0` (major), `1.1.0` (minor), or `1.0.1` (patch) depending on the option you choose. If you want to publish a `1.0.0` tag for your first release you'll need to update your `package.json` version to something smaller (`0.1.0` for example).
</details>

<details>
	<summary>What does the following error mean? `Potentially unhandled rejection [21] Error: Command failed: git fetch upstream --tags`</summary>
	You don't have an `upstream` set for your repository. You can add an upstream
	with the following command `git remote add upstream https://github.com/[upstream-owner]/[repo-name].git`
</details>

<details>
	<summary>What does the following error mean? `Error: Command failed: "npm publish"`</summary>
	You may have not authenticated with npm on your machine yet. You can do so
	with the following command `npm adduser`.
</details>

<details>
	<summary>What does the following error mean? `Potentially unhandled rejection [8] Error: Command failed: "git push upstream master --tags"`</summary>
	If you have GitHub Two Factor Authentication enabled and you are prompted for
	your password when `tag-release` tries to push code then you'll need to use
	your GitHub `token` as your password. If you use the `--verbose` flag when
	running `tag-release` it'll log your token to the console.
</details>
