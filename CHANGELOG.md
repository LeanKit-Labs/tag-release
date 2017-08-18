## 5.x

### 5.4.1

* Cleaned up some unnecessary stuff that was happening in the pre-release workflow

### 5.4.0

* Added logic to strip redundant prefixes from prerelease identifiers.

### 5.3.3

* Removed --qa step to create an upstream branch before pushing into it

### 5.3.2

* Fixed issue when running --qa from develop and master branch

### 5.3.1

* Band-Aided possible issue force pushing develop when using --qa

### 5.3.0

* Added the ability to update a --qa created feature branch

### 5.2.1

* Fixed issue with merge commits being removed with rebases
* Fixed issue with Github auth
* Get tags from repo for version bump using --qa feature instead of manual entry

### 5.2.0

* Added --pr feature to update lightning-ui and create a PR to develop for change
* Added --qa feature to create intial upstream branch for lightning

### 5.1.1

* Updated README.md for --promote feature and fixed --version command
* Changed single quotes to double quotes in some commands for windows users
* Correctly fetch upstream to retrieve changes
* Added README.md reminder to PR checklist

### 5.1.0

* Keep merge commit when doing pre-release promotion to official release
* Remove merge commits for rebase with promotion.
* Remove step for updating CHANGELOG.md for pre-releases
* Added promote command to promote pre-releases to offical releases
* Added a pull request template file

### 5.0.0

* Refactored internal implementation for flexibility and extensibility
* Migrated all specs from Ava to Jest
* Don't remove existing CHANGELOG.md entries for major version bumps

## 4.x

### 4.5.0

* Added reset flag.

### 4.4.0

* Added new --config option to suport manifest.config

### 4.3.1

* Fix readme table and add how to tag 1.0.0 FAQ

### 4.3.0

* Update README.md
* Added README.md section.
* Added tests for new pre-release option.
* Added ability to create/tag pre-release builds.

### 4.2.1

* Moved Release Jump question until after user previews commits for this release
* Revert "Added preview of git logs to start of tag-release process"

### 4.2.0

* Added preview of git logs to start of tag-release process
* Fixed issue where remotes not ending in `.git` would cause the Github Release to fail

### 4.1.0

* Help the user along with messages
* Check for newer version of tag-release right away
* Fix upstream/develop branch detection on windows

### 4.0.1

* Move babel-plugin-rewire to dependencies

### 4.0.0

* Don't prompt for npm publish if set to private
* Compare current version with latest version from npm
* Breaking Change: Running `tag-release -v` now shows the version instead of running in verbose mode. To use verbose mode, use `tag-release --verbose`

## 3.x

### 3.3.1

* Grab repo name from remote upstream instead of package.json
* Add a section to the README about common errors
* Add verbose flag and fix race condition for setGitConfig

### 3.3.0

* Update to support GitHub Two Factor Authentication
* Publish tagged version as a GitHub release

### 3.2.0

* Auto-detect remote develop branch
* Write CHANGELOG.md appropriately if there is none
* Create log correctly when there are no tags

### 3.1.0

* When asking to publish show where it will published to

### 3.0.1

* Fix windows babel path bug
* Don't log in gitCheckoutDevelop if there is no develop branch

### 3.0.0

* Update to allow babel-register to run in the global npm context
* Enable Node v0.12.x support as well as Node v5.x

## 2.x

### 2.0.0

* Remove babel dependency and use native node5 es6 features

## 1.x

### 1.0.0

* Initial Release
