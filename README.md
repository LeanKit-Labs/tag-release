# `tag-release`

## Installation
```
$ npm install -g tag-release
```

## Usage

### Default
```
$ tag-release
```

You will be prompted for information regarding what type of release you are
making (major, minor, patch). Along the way, you'll have the opportunity to
verify, modify, or cancel the `tag-release` process.

### Commands
`tag-release` supports many different commands and options. You can view a summary of these by providing the `--help` option from the terminal.

```
  Usage: tag-release [options] [command]


  Options:

    --verbose                console additional information
    --maxbuffer <n>          overrides the max stdout buffer of the child process, size is 1024 * <n>
    -c, --config <filePath>  path to json configuration file (defaults to './package.json')
    -V, --version            output the version number
    -h, --help               output usage information


  Commands:

    continue                     continue from a previously conflicted state
    config <filePath>            override .json configuration file path, defaults to './package.json'
    dev                          create a PR from origin feature branch to upstream feature branch
    pr [scope]                   update consumer project feature branch and create a PR to develop
    prerelease|pre [identifier]  create a pre-release
    promote|pro [tag]            promote a pre-release tag previously created by tag-release
    qa [scope]                   create initial upstream feature branch for consumer project
    reset                        reset repo to upstream master/develop branches
    l10n                         update and prerelease updated localization branches
    help [cmd]                   display help for [cmd]
```

### Pre-releases

Pre-releases are mainly for interim releases that are not intended for production use.
The benefit of this approach is being able to quickly deploy releases that can be easily
iterated upon.

> **Note**: When using the `prerelease` command you are required to have an upstream feature branch with the same name.

```
Usage:
   $ tag-release prerelease
   $ tag-release pre
   $ tag-release prerelease foo
   $ tag-release pre foo

Example:

   $ tag-release prerelease
   ? Pre-release Identifier: foo
   ? What type of release is this (Use arrow keys)
   ❯ Pre-major (Breaking Change)
     Pre-minor (New Feature)
     Pre-patch (Bug Fix)
     Pre-release (Bump existing Pre-release)
   etc...
```

Using the optional option `tag` will allow you to bypass the identifier step.

```
Example:

   $ tag-release prerelease foo
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

### Pre-release Promotion

This command is used for promoting a pre-release created by `tag-release` into an offical release
that is intended to be deployed to production.

```
Usage:
   $ tag-release promote

Example:

   $ tag-release promote
   ? Select the pre-release you wish to promote: (Use arrow keys)
   > v1.1.1-blah.0
     v2.0.0-another.1
     v3.0.0-this.5
```

After selecting the tag you wish to promote it will attempt remove all pre-release commits from history
and rebase it with master. If conflicts arise you will be prompted to fix the conflicts and then continue
with the promotion process by running `tag-release continue`. This cycle will continue until all conflicts
are resolved and then it will continue as normal.

Using the optional option `tag` will allow you to bypass the selection step.

```
Example:

   $ tag-release promote v1.1.1-feature.2
   $ tag-release promote 1.1.1-feature.2 # v is optional for tag
```

### QA

This command is used to create an upstream feature branch in your consumer project that pulls in your dependency projects.

Its primary use is to pull in pre-releases that were previously created using `tag-release prerelease`. It will give you the option to update package versions, ask for the reason you are making this change (typically this is
the theme of all changes for your work), and prompt you with a list of tags to choose from per package.

```
Usage:
   my-consumer-project git:(develop) tag-release qa

Example:

   my-consume-project git:(develop) tag-release qa
   ? Select the package(s) you wish to update: (Press <space> to select)
   ❯ ◯ my-dependency-project
     ◯ my-other-dependency-project
     ◯ my-last-dependency-project
   ? What is the reason for this change: This is my reason
   ? Update my-dependency-project from 1.2.3 to: (Use arrow keys)
   ❯ 2.0.0-test.0
     1.2.4-bug.1
     1.3.0-somechange.0
   ? What type of change is this work (Use arrow keys)
   ❯ feature
     defect
     rework
   ? What do you want your branch name to be? feature-reason
```
> **Note**: The branch name that is created to hold your changes is based off of the first pre-release identifier
from the package versions you are updating, but if there is no identifier it will use your "reason for this change"
message but by removing some non-critical words. You will also have the ability to update this branch's name to
your liking as well.

If you find yourself having to update a pre-release you created you can update your feature branch by running `tag-release qa` again from the feature branch. It will pick up the packages you previously updated and give you the ability to update them to the new versions. This is based on the lastest commit being a bump commit in the follow format: `Bumped [ package ] to [ version ]: [ reason ]`. If there are multiple package changes the format will be the following: `Bumped [ package ] to [ version ], [ package ] to [ version ]: [ reason ]`

If the default scope `tag-release` uses is not fitting for your usage, you have the ability to provide your own.

```
Usage:
   my-consumer-project git:(develop) tag-release qa myorg
```

> **Note**: `qa` will use a default scope of `lk`

### PR

This command is used to create a PR into your consumer project's develop branch.

It will read in the packages that you updated from your bump commit and ask you which version you wish to update them to. This is where you will pick offical releases and not pre-releases.

> **Note**: `pr` should be run from your feature branch that was created using `qa`

```
Usage:
   my-consumer-project git:(my-feature-branch) tag-release pr

Example:

   my-consumer-project git:(my-feature-branch) tag-release pr
   ? Update my-dependency-project from 1.2.3-identifier.1 to: (Use arrow keys)
   ❯ 2.0.0
     1.3.0
     1.2.4
     1.2.3-identifier.1
```

> **Note**: `pr` will automatically create the GitHub PR for you and add the appropriate `Ready to Merge into Develop` label

### l10n

This command is used when you want to create pre-releases of all updated consumer project's localization branches.

You are required to setup the following in your `.tag-releaserc.json` file in your root:

```
{
   "rootDirectory": "/path/to/root/of/repos",
   "repos": [
       { "repo_name": "localization-branch-name" },
       { "another_repo_name": "another-localization-branch-name" }
   ]
}
```

> **Note**: `l10n` will automatically create a qa branch and pull in all you pre-releases if it finds a host project amoung the lists of repos you are wanting to pre-release.

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

Using the `--verbose` option off any of the `tag-release` commands will output the
`username` and `token` information that `tag-release` is using.

```
$ tag-release prerelease --verbose
--- GitHub Configuration ------------------------------------------------------
username             : johndoe
token                : a92282731316b2d4f2313ff64b1350b78a5d4cf6
-------------------------------------------------------------------------------
```

### `tag-release` rc File and Environment Variables

`tag-release` will attempt to read from the rc file `.tag-releaserc.json` or the environment variables, 
`LKR_GITHUB_USER` and `LKR_GITHUB_TOKEN`.

example rc file:
```
{
  username: "user@name.com",
  token: "token12345"
}
```

Where `username` is your GitHub username and `token` is your Github authentication token.

## `tag-release` as a Library

### Usage

```
const tagRelease = require( "tag-release" );

tagRelease.run({release:'minor', cwd: "/path/to/repo" }).then(result=>{
	console.log( "success", result);
}).catch(error=>{
	console.log("failiure", error );
});
```

> **Note**: `release` and `cwd` are required

`release` can be any of the following:
```
major
minor
patch
```

`cwd` is the current working directory of the repository that `tag-release` will run on.

## Release Workflow

1. Fork the dependency project & add development updates to your project.

> **Note**: An example would be forking my-dependency-project and developing a feature based off its master branch. Your local branch should start with feature, defect, or rework (ex: feature-amazing-thing).

2. Make a GitHub PR for your dependency project against an upstream branch.

```
my-dependency-project git:(my-feature-branch) tag-release dev
```

3. After PR review is approved, pre-release your dependency project.

```
my-dependency-project git:(my-feature-branch) tag-release prerelease new-feature
```

> **Note**: This will create a pre-release that will be published to npm (sinopia) and GitHub (ex: 1.2.3-new-feature.0)

4. Create a consumer project upstream branch to include your pre-released dependency project for QA.

```
my-consumer-project git:(master) tag-release qa
```

> **Note**: This will create an upstream feature branch on the consumer project.

5. Deploy your consumer project's branch to a QA test environment.

6. Once QA has passed your code, promote dependency project's pre-release to an offical release.

```
my-dependency-project git:(master) tag-release promote
```

> **Note**: This will change your pre-release from something like 1.2.3-new-feature.0 to 1.2.3 or whatever version is next in line. You will use this version in the next step.

7. Update your consumer project's branch to use the real dependency project's version and create a GitHub PR for the AEs to merge into develop.

```
my-consumer-project git:(my-feature-branch) tag-release pr
```

> **Note**: `tag-release` will auto-create the GitHub PR for you and add the appropriate `Ready to Merge into Develop` label.

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
	your GitHub `token` as your password. If you use the `--verbose` option when
	running a `tag-release` command it'll log your token to the console.
</details>
