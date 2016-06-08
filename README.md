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

Examples:

 $ tag-release
 $ tag-release --release major
 $ tag-release -r minor
```

### GitHub Integration

You will only be asked for your GitHub username and password when you first
start using `tag-release`. It will generate an authorization token with
GitHub and store that in your global git configuration for later usage.

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
