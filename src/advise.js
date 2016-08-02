import wrap from "word-wrap";

const MESSAGES = {
	gitFetchUpstreamMaster: `It looks like git couldn't fetch your upstream.

tag-release needs an upstream remote in order to work correctly. You can double check by running 'git remote -v'

To add a remote run 'git remote add upstream https://github.com/owner/repo.git'`,
	gitMergeUpstreamMaster: `It looks like git couldn't merge upstream/master.

It could be that your local environment is out of sync with your upstream.

You might consider reseting your master by running 'git reset --hard upstream/master'`,
	updateVersion: `It looks like there isn't a package.json for this project.

You can easily create one by running 'npm init' and walking through the steps.`,
	gitLog: `It looks like you don't have any commits to tag.

Are you sure you need to tag and release?

Press 'Control-c' to exit`,
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

You might consider reseting your develop by running 'git reset --hard upstream/develop'`
};
const MAXIMUM_WIDTH = 50;

export default function( key, width = MAXIMUM_WIDTH ) {
	return wrap( MESSAGES[ key ], { width, indent: "" } );
}
