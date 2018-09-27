const wrap = require("word-wrap");

const MESSAGES = {
	gitCommandFailed: `Ooops. Hhmmm...that didn't work very well.

You really shouldn't be seeing this message, so, if you are, ping someone in engineering to see if they can help you figure out what went wrong.`,
	fetchUpstream: `It looks like git couldn't fetch your upstream.

tag-release needs an upstream remote in order to work correctly. You can double check by running 'git remote -v'

To add a remote run 'git remote add upstream https://github.com/owner/repo.git'`,
	gitMergeUpstreamMaster: `It looks like git couldn't merge upstream/master.

It could be that your local environment is out of sync with your upstream.

You might consider reseting your master by running 'git reset --hard upstream/master'`,
	updateVersion: `It looks like there isn't a package.json for this project.

You can easily create one by running 'npm init' and walking through the steps.`,
	"gitLog.log": `It looks like you don't have any commits to tag.`,
	getCurrentBranchVersion: `It looks like there isn't a package.json for this project.

You can easily create one by running 'npm init' and walking through the steps.`,
	"gitLog.tag": `It looks like you may have an old version of git installed.

You need at least version 2.x in order for tag-release to work properly.`,
	npmPublish: `It looks like npm couldn't publish your package.

1. This project may not need to be published. If not, add a private flag in the package.json to not be asked again.
2. You may not be authorized with npm. You can authenticate by running 'npm adduser'
3. You may not have rights to publish this package. If not, ask the owner to add you as a collaborator.
`,
	checkoutDevelop: `It looks like you couldn't switch to your local develop branch.

Your upstream has a develop branch and you need one too.

You can retrieve upstream's develop by running 'git branch -t upstream/develop'`,
	gitMergeDevelopWithMaster: `It looks like git couldn't merge master into develop.

It could be that your local environment is out of sync with your upstream.

You might consider reseting your develop by running 'git reset --hard upstream/develop'`,
	gitPushUpstreamFeatureBranch: `It looks like git couldn't push to your feature branch.

It could be that your local environment is out of sync with your upstream or you are missing a upstream feature branch.

You might consider reseting your branch by running 'git reset --hard upstream/develop' or creating a upstream feature branch.`,
	gitStash: `It looks like you had some uncommited changes. We went ahead and stashed them so you don't lose any of your work.`,
	gitUpstream: `It appears we couldn't access your remote upstream repository.

tag-release needs an upstream remote in order to work correctly. You can double check by running 'git remote -v'

To add a remote run 'git remote add upstream https://github.com/owner/repo.git'`,
	gitOrigin: `It appears we couldn't access your remote origin repository.

To add a remote origin run 'git remote add origin https://github.com/username/repo.git'

You can double check by running 'git remote -v'`,
	gitRebaseUpstreamBase: `It looks like there was some conflict(s) while trying to rebase with the upstream base.

Unfortunately, tag-release can't auto-magically fix them. Please fix the conflict at hand and then run 'tag-release continue'. Tag-release
will handle adding the conflicting files and continuing with the rebase.`,
	gitRebaseInteractive: `It looks like there was some conflict(s) while trying to rebase with upstream/master.

Unfortunately, tag-release can't auto-magically fix them. Please fix the conflict at hand and then run 'tag-release continue'. Tag-release
will handle adding the conflicting files and continuing with the rebase.`,
	gitCheckConflictMarkers: `We detected the presence of conflict markers: '<<<<<<<', '=======', and/or '>>>>>>>'

Please fix all conflict markers with the current conflict and then run 'tag-release continue'.`,
	noPackagesInScope: `It appears there are no packages under the current scope. Please verify the scope or that you are running 'tag-release qa' from a valid repository.`,
	noPackages: `It appears that there are no packages to promote. Please make a selection using the spacebar and finalizing your selection with enter.`,
	saveState: `It appears something went wrong attempting to save state.

You really shouldn't be seeing this message, so, if you are, ping someone in engineering to see if they can help you figure out what went wrong.`,
	gitMergeUpstreamBranch: `It appears that when trying to merge with the upstream branch something went wrong.

Either you don't have an upstream with the same name as your local, or we weren't able to 'merge --ff-only' on your local branch with the upstream.`,
	missingPackageJson: `It appears you do not have a package.json. A package.json is required to use tag-release.

You can use the 'npm init' command to generate a package.json for you.`,
	privatePackage: `It appears you are trying to pre-release a private repository. The pre-release flag is meant for dependency projects.

Did you mean to run 'tag-release qa' instead?`,
	qaNoChangeNoDevelop: `It appears this repository doesn't have any new changes or a develop branch.

Are you sure you need to run 'tag-release qa'?`,
	gitBranchAlreadyExists: `The branch you are trying to create appears to already exist. Please choose a different name.`,
	localBranchDeleteFailure: `The feature branch failed to be deleted locally. It most likely doesn't exist.`,
	upstreamBranchDeleteFailure: `The feature branch failed to be deleted in the upstream. It most likely doesn't exist.`,
	saveDependencies: `It appears something went wrong attempting to save your dependencies.

You really shouldn't be seeing this message, so, if you are, ping someone in engineering to see if they can help you figure out what went wrong.`,
	npmInstall: `Sorry, we were unable to install and update your package-lock.json`,
	remoteBranchOutOfDate: `It appears that your remote branch couldn't be updated.

It's most likely because your base has changed so you may need to run 'git push -f remote branch-name'`,
	maxBufferExceeded: `It appears you have overflowed stdout. Congratulations!

In order to override the maxBuffer limit run 'tag-relase maxbuffer <n>' and provide it an appropriate buffer size.

The default size is 1024 * 5000. Where 5000 is <n>.`
};

const MAXIMUM_WIDTH = 50;

module.exports = function(key, width = MAXIMUM_WIDTH) {
	return wrap(MESSAGES[key], { width, indent: "" });
};
