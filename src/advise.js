import wrap from "word-wrap";

const MESSAGES = {
	gitCommandFailed: `Ooops. Hhmmm...that didn't work very well.

You really shouldn't be seeing this message, so, if you are, ping someone in engineering to see if they can help you figure out what went wrong.`,
	gitFetchUpstreamMaster: `It looks like git couldn't fetch your upstream.

tag-release needs an upstream remote in order to work correctly. You can double check by running 'git remote -v'

To add a remote run 'git remote add upstream https://github.com/owner/repo.git'`,
	gitMergeUpstreamMaster: `It looks like git couldn't merge upstream/master.

It could be that your local environment is out of sync with your upstream.

You might consider reseting your master by running 'git reset --hard upstream/master'`,
	updateVersion: `It looks like there isn't a package.json for this project.

You can easily create one by running 'npm init' and walking through the steps.`,
	"gitLog.log": `It looks like you don't have any commits to tag.

Are you sure you need to tag and release?

Press 'Control-c' to exit`,
	getCurrentBranchVersion: `It looks like there isn't a package.json for this project.

You can easily create one by running 'npm init' and walking through the steps.`,
	"gitLog.tag": `It looks like you may have an old version of git installed.

You need at least version 2.x in order for tag-release to work properly.`,
	npmPublish: `It looks like npm couldn't publish your package.

1. This project may not need to be published. If not, add a private flag in the package.json to not be asked again.
2. You may not be authorized with npm. You can authenticate by running 'npm adduser'
3. You may not have rights to publish this package. If not, ask the owner to add you as a collaborator.
`,
	gitCheckoutDevelop: `It looks like you couldn't switch to your local develop branch.

Your upstream has a develop branch and you need one too.

You can retrieve upstream's develop by running 'git branch -t upstream/develop'`,
	gitMergeMaster: `It looks like git couldn't merge master into develop.

It could be that your local environment is out of sync with your upstream.

You might consider reseting your develop by running 'git reset --hard upstream/develop'`,
	gitPushUpstreamFeatureBranch: `It looks like git couldn't push to your feature branch.

It could be that your local environment is out of sync with your upstream or you are missing a upstream feature branch.

You might consider reseting your branch by running 'git reset --hard upstream/develop' or creating a upstream feature branch.`,
	gitStash: "It looks like you had some uncommited changes. We went ahead and stashed them so you don't lose any of your work.",
	gitUpstream: `It appears we couldn't access your remote upstream repository.

tag-release needs an upstream remote in order to work correctly. You can double check by running 'git remote -v'

To add a remote run 'git remote add upstream https://github.com/owner/repo.git'`
};

const MAXIMUM_WIDTH = 50;

export default function( key, width = MAXIMUM_WIDTH ) {
	return wrap( MESSAGES[ key ], { width, indent: "" } );
}
