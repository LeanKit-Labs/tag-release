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
  -c, --config [filePath]        Path to JSON Configuration file (defaults to './package.json')
  -r, --release [type]           Release type (major, minor, patch)
  --verbose                      Console additional information
  -V, --version                  Output the version number
  -p, --prerelease               Create a pre-release
  -i, --identifier <identifier>  Identifier used for pre-release
  --reset                        Reset repo to upstream master/develop branches
  --promote [tag]                Promotes specified pre-release tag to an offical release
  --continue                     Continues the rebase process of a tag promotion
  --qa [scope]                   Create initial upstream branch for upstream repo
  --pr [scope]                   Update package.json to bump upstream repos and create a PR to develop
  --maxbuffer <n>                Overrides the max stdout buffer of the child process. Size is 1024 * <n>.

Examples:

   $ tag-release
   $ tag-release --config ../../config.json
   $ tag-release -c ./manifest.json
   $ tag-release --release major
   $ tag-release -r minor
   $ tag-release --verbose
   $ tag-release -V
   $ tag-release --version
   $ tag-release --prerelease
   $ tag-release -p
   $ tag-release -p -i foo
   $ tag-release --reset
   $ tag-release --promote
   $ tag-release --promote v1.1.1-my-tagged-version.0
   $ tag-release --continue
   $ tag-release --qa
   $ tag-release --qa myorg
   $ tag-release --pr
   $ tag-release --pr myorg
   $ tag-release --maxbuffer 5000
```

### Pre-releases

Pre-releases are mainly for interim releases that are not intended for production use.
The benefit of this approach is being able to quickly deploy releases that can be easily
iterated upon. In order use this feature will you have to provide `tag-release` with the
`-p` or `--prerelease` command-line flag. Afterwards, you will be prompted for a identifier
(or you can provide the identifier on the command-line) that will be used in the pre-release tag.
Then the flow will continue as normal release.

> **Note**: When using the pre-release feature you should have an upstream feature branch with the same name.

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

### Pre-release Promotion

This feature is used for promoting a pre-release to an offical release that is intended to go out
into production. In order use this feature will you have to provide `tag-release` with the
`--promote` as a command-line flag.

```
Usage:
   $ tag-release --promote

Example:

   $ tag-release --promote
   ? Select the pre-release you wish to promote: (Use arrow keys)
   > v1.1.1-blah.0
     v2.0.0-another.1
     v3.0.0-this.5
```

After selecting the tag you wish to promote it will attempt remove all pre-release commits from history
and rebase it with master. If conflicts arise you will be promoted to fix the conflicts and then continue
with the promotion process by running `tag-release --continue`. This cycle will continue until all conflicts
are resolve and then it will flow as a normal release from that point on.

The `--promote` feature also allows for an optional command-line argument of a tag in the follow form:

```
Example:

   $ tag-release --promote v1.1.1-feature.2
   $ tag-release --promote 1.1.1-feature.2 # v is optional for tag
```

This will skip the selection process of a tag you wish to promote and it will flow the same flow as the
normal `--promote` command-line argument above.

### QA

This feature is used to create an upstream feature branch in your consumer project that pulls in your dependency projects.
Its primary use is to pull in pre-releases that were previously created using `tag-release --prerelease`. It will
give you the option to update package versions, ask for the reason you are making this change (typically this is
the theme of all changes for your work), and prompt you with a list of tags to choose from per package.

```
Usage:
   my-consumer-project git:(develop) tag-release --qa

Example:

   my-consume-project git:(develop) tag-release --qa
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

If you find yourself having to update a pre-release you created you can update your feature branch by running `tag-release --qa`
from within that feature branch. It will pick up the packages you previously updated and give you the ability to update them
to the new versions. This is based on the lastest commit being a bump commit in the follow format:
Bumped [ package ] to [ version ]: [ reason ]. If there are multiple package changes the format will be the following:
Bumped [ package ] to [ version ], [ package ] to [ version ]: [ reason ]


If the default scope `tag-release` uses is not fitting for your usage, you have the ability to provide your own.

```
Usage:
   my-consumer-project git:(develop) tag-release --qa myorg
```

> **Note**: `--qa` will use a default scope of `lk`

### PR

This feature is used to create a PR into your consumer project's develop branch. It will read in the packages that
you updated from your bump commit and ask you which version you wish to update them to. This is where you will
pick offical releases and not pre-releases.

> **Note**: `--pr` should be run from your branch that was created using `--qa`

```
Usage:
   my-consumer-project git:(my-feature-branch) tag-release --pr

Example:

   my-consumer-project git:(my-feature-branch) tag-release --pr
   ? Update my-dependency-project from 1.2.3-identifier.1 to: (Use arrow keys)
   ❯ 2.0.0
     1.3.0
     1.2.4
     1.2.3-identifier.1
```

> **Note**: `--pr` will auto-create the GitHub PR for you and add the appropriate `Ready to Merge into Develop` label

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
$ tag-release --verbose
--- GitHub Configuration ------------------------------------------------------
username             : johndoe
token                : a92282731316b2d4f2313ff64b1350b78a5d4cf6
-------------------------------------------------------------------------------
? What type of release is this (Use arrow keys)
❯ Major (Breaking Change)
 Minor (New Feature)
 Patch (Bug Fix)
```

### Release Workflow

1. Fork the dependency project & add development updates to your project (manual)

> **Note**: An example would be forking my-dependency-project and developing a feature based off its master branch. Your local branch should start with feature, defect, or rework (ex: feature-amazing-thing).

2. Make a GitHub PR for your dependency project against an upstream branch (manual)

> **Note**: Your upstream branch should be based off of the master branch so that when you create your PR it is comparing only changes different from master.

3. After PR review is approved, pre-release your dependency project (automated by `tag-release`)

```
my-dependency-project git:(my-feature-branch) tag-release --prerelease --identifier new-feature
```

This can also be done using the shorthand syntax...

```
my-dependency-project git:(my-feature-branch) tag-release -pi new-feature
```

> **Note**: This will create a pre-release that will be published to npm (sinopia) and GitHub (ex: 1.2.3-new-feature.0)

4. Create a consumer project upstream branch to include your pre-released dependency project for QA (automated by `tag-release`)

```
my-consumer-project git:(master) tag-release --qa
```

> **Note**: This will create an upstream feature branch on the consumer project.

5. Deploy your consumer project's branch to a QA test environment (manual)

6. Once QA has passed your code, promote dependency project's pre-release to an offical release (automated by `tag-release`)

```
my-dependency-project git:(master) tag-release --promote
```

> **Note**: This will change your pre-release from something like 1.2.3-new-feature.0 to 1.2.3 or whatever version is next in line. You will use this version in the next step.

7. Update your consumer project's branch to use the real dependency project's version and create a GitHub PR for the AEs to merge into develop (automated by `tag-release`)

```
my-consumer-project git:(my-feature-branch) tag-release --pr
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
	your GitHub `token` as your password. If you use the `--verbose` flag when
	running `tag-release` it'll log your token to the console.
</details>
