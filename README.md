# `tag-release`

## Usage

```
$ tag-release
```

You will be prompted for information regarding if there is a `develop`
branch in your repository and what type of version update (major, minor,
patch). Along the way, you'll have the opportunity to verify, modify, or
cancel the `tag-release` process.

### Flags

#### Develop

```
$ tag-release --develop
$ tag-release -d
```

#### Release

```
$ tag-release --release major
$ tag-release -r minor
```

#### Combination

```
$ tag-release -d -r patch
```

## Future Updates

* [x] Remove the .shortlog temp file when complete
* [ ] Don't ask about `develop` branch. Programmatically determine if the repository has a `develop` branch or not.
* [x] Clean up the `shortlog` better by removing commits blocks that are empty (the committer has no commits after merges were removed).
* [ ] Don't ask to publish to `npm`. Look at the `package.json` private key to determine.
* [ ] Publish tag as a release on GitHub. Get remote upstream URL in order to pass to API.
