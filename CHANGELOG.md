## 7.x

### 7.0.0

* Fixed issue with scope and conflict resolution
* Converted @lk scope to @banditsoftware scope

## 6.x

### 6.19.0

* Reduced LK Id questions into one

### 6.18.0

* Added scope check for LK id
* Added support for adding a LK id

### 6.17.1

* Don't allow user to keep branch if on develop, master, or main branch when running qa

### 6.17.0

* Removed --config option
* Fixed renaming config path references

### 6.16.0

* Use paths from .git root

### 6.15.0

* Updated bump commit reorder advise
* Renamed reOrderBumpAndLocalizationCommit to reOrderBumpCommit
* Allow reorder commits no matter where bump commit is
* Made en-US.yaml commit check or generic
* Allow pr to work with bump commit not being latest commit. (kind of)
* Update package-lock.json on qa flow

### 6.14.1

* Addressed issues with continue workflow and conflicts with scripts
* Fixed scripts running at incorrect times during workflow

### 6.14.0

* Added --no-bump flag to pr command to enable opening a PR without the bump commit requirement

### 6.13.0

* Updated README.md with pre and post script documentation

### 6.12.2

* Log output from pre and post scripts
* Added ability to to read pre and post scripts for commands from package.json

### 6.12.1

* Handle when there is an empty change set for l10n

### 6.12.0

* Added coverage flag to l10n command

### 6.11.1

* Fixed version used when comparing to get log when in pre-release mode

### 6.11.0

* Added initial default tag version

### 6.10.0

* Made tag-release more new repo friendly
* Consolidated stash index commands

### 6.9.0

* add link to github on npm page

### 6.8.1

* Added the ability to reset to branch if stashed. Fixed qa issue with no pre-releases

### 6.8.0

* Added default for l10n status colors
* Updated output to include more information and added status colors

### 6.7.0

* Updated statuses to be more accurate
* Fixed state not resetting after last index
* Changed structure of config l10n repos
* Fixed issue with commit modifications, insertions, and deletions as well as a few logistic bugs

### 6.6.0

* Added l10n command and --check command flag

### 6.5.0

* Updated README.md
* Added branch arg to dev workflow

### 6.4.0

* Added retry for rebasing to handle empty conflicts

### 6.3.0

* Added informative error format
* Addressed several tech debt issues

### 6.2.1

* Updated contextual help messages to fit with new commands

### 6.2.0

* Added error on no commits
* Added respect for package-lock.json being in .gitignore

### 6.1.0

* Added pushing specific tags to remote instead of all tags

### 6.0.0

* Updated rcfile to use current/HOME directories. Fixed workflow issues
* Updated help
* Updated documentation
* Removed -i, --identifier flag from prerelease and added optional identifier arg
* Added support for rc file and env variable overrides.
* Only support git-style commands

## 5.x

### 5.19.0

* Added git style command-line arguments

### 5.18.0

* Updated help.js

### 5.17.0

* Updated help.js

### 5.16.1

* Updated CHANGELOG.md to include v5.16.0 changes

### 5.16.0

* Updated version latest/updgrade tag-release message
* Added override for stdout maxbuffer diff

### 5.15.3

* Fixed quotes breaking changeReason during --qa
* Fixed updating local master or develop before creating upstream branch with --dev

### 5.15.2

* Removed diff on package-lock.json when it doesn't exist
* Fixed errors messages provided to users, including some undefined messages

### 5.15.1

* Fixed issues with conflicts during --pr
* Fixed pushing to upstream for pre-release
* Renamed method deleteUpstreamBranch to deleteBranchUpstream
* Removed some duplicated code
* Only add tracking on push
* Fixed updating package-lock.json version
* Added tests for --dev workflow
* Added basing --dev upstream branch creation off develop when exists

### 5.15.0

* Added --dev feature for creating a origin feature branch into upstream feature branch pull request

### 5.14.2

* Remove default exist in OnError for git commands
* Removed advise when local or upstream branch removal fails
* Fixed undefined message on conflict resolution message and now install exact versions of npm packages instead of with the default semver range operator

### 5.14.1

* Fixed error when dependencies didn't exist during default tag-release flow
* Fixed --qa not merging with upstream branch when exists

### 5.14.0

* Added updating and adding package-lock.json for promote, pr, and default tag-release flow

### 5.13.0

* Added new eslint rules, give better error message when branch already exists on the upstream, cleanup branches locally and upstream after promotion

### 5.12.0

* Auto bump with existing pre-release identifier

### 5.11.0

* Added --verbose flag to --help

### 5.10.0

* Added ability to have changes in hosting repository and bump versions.

### 5.9.2

* No longer able to pre-release hosting projects

### 5.9.1

* Moved babel-preset-env to dependencies

### 5.9.0

* Use svn_url when remotes use svn_url
* Added tests for verifying remotes, package.json, CHANGELOG.md, and changeReason validation
* Made changeReason required when running --qa
* Added babel-preset-env and made --reset more new repo friendly ( verify remotes, package.json, CHANGELOG.md )
* Added prettier support

### 5.8.1

* Removed powershell step from PR review steps
* Removed Bumped [pkg] to [v] from PR title to only use commit reason
* Fixed --promote not cleaning up tmp branch
* Cleaned up some of the workflow steps
* Fixed add to only add tracked files after conflict resolution
* Use regex to find pre-release commits to remove

### 5.8.0

* Added auto conflict resolution for package.json with running --pr

### 5.7.0

* Refactored help output, and added link to LK tag-release workflow docs

### 5.6.0

* Refactored common sequential steps into shared workflow groups for reuse

### 5.5.0

* Updated README.md for qa and pr command-line args and added release flow section

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
* Don't log in checkoutDevelop if there is no develop branch

### 3.0.0

* Update to allow babel-register to run in the global npm context
* Enable Node v0.12.x support as well as Node v5.x

## 2.x

### 2.0.0

* Remove babel dependency and use native node5 es6 features

## 1.x

### 1.0.0

* Initial Release
