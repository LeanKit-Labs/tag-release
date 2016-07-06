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
