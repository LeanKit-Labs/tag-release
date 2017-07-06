import util from "./utils";

const git = {
	runCommand( { args, showOutput = true, logMessage, failHelpKey = "gitCommandFailed", exitOnFail = false } ) {
		const command = `git ${ args }`;

		if ( !showOutput ) {
			return util.exec( command );
		}

		util.log.begin( logMessage || command );
		return util.exec( command )
			.then( result => {
				util.log.end();
				return Promise.resolve( result );
			} )
			.catch( err => {
				util.log.end();
				util.advise( failHelpKey, { exit: exitOnFail } );
				return Promise.reject( err );
			} );
	},

	getRemoteBranches() {
		const args = "branch -r";
		return git.runCommand( { args } );
	},

	fetch( branch = "master", includeTags = true, failHelpKey ) {
		const args = `fetch upstream ${ branch }${ includeTags ? " --tags" : "" }`;
		return git.runCommand( ( failHelpKey && failHelpKey.length ) ? { args, failHelpKey } : { args } );
	},

	fetchWithoutTags( branch = "master" ) {
		return git.fetch( branch, false );
	},

	fetchUpstreamMaster() {
		return git.fetch( "master", true, "gitFetchUpstreamMaster" );
	},

	checkout( branch, failHelpKey ) {
		const args = `checkout ${ branch }`;
		return git.runCommand( ( failHelpKey && failHelpKey.length ) ? { args, failHelpKey } : { args } );
	},

	checkoutMaster() {
		return git.checkout( "master" );
	},

	checkoutDevelop() {
		return git.checkout( "develop", "gitCheckoutDevelop" );
	},

	merge( branch, fastForwardOnly = true, failHelpKey ) {
		const args = `merge ${ branch }${ fastForwardOnly ? " --ff-only" : "" }`;
		return git.runCommand( ( failHelpKey && failHelpKey.length ) ? { args, failHelpKey } : { args } );
	},

	mergeMaster() {
		return git.merge( "master", true, "gitMergeMaster" );
	},

	mergeUpstreamMaster() {
		return git.merge( "upstream/master" );
	},

	mergeUpstreamDevelop() {
		return git.merge( "upstream/develop", false );
	},

	getCurrentBranch() {
		const args = "rev-parse --abbrev-ref HEAD";
		return git.runCommand( { args, log: "Getting current branch" } );
	},

	getTagList() {
		const args = "tag --sort=v:refname";
		return git.runCommand( { args, logMessage: "Getting list of tags" } ).then( tags => {
			tags = tags.trim();
			tags = tags.split( "\n" );
			return Promise.resolve( tags );
		} );
	},

	shortLog( tag ) {
		let args = `--no-pager log --no-merges --date-order --pretty=format:'%s'`;
		args = ( tag && tag.length ) ? `${ args } ${ tag }..` : args;
		return git.runCommand( { args, logMessage: "Parsing git log" } );
	},

	diff( files ) {
		const args = `diff --color ${ files.join( " " ) }`;
		return git.runCommand( { args } );
	},

	add( files ) {
		const args = `add ${ files.join( " " ) }`;
		return git.runCommand( { args } );
	},

	commit( comment ) {
		const args = `commit -m "${ comment }"`;
		return git.runCommand( { args } );
	},

	tag( tag, annotation ) {
		const args = `tag -a ${ tag } -m ${ annotation || tag }`;
		return git.runCommand( { args } );
	},

	push( branch, includeTags = true, failHelpKey ) {
		const args = `push ${ branch }${ includeTags ? " --tags" : "" }`;
		return git.runCommand( ( failHelpKey && failHelpKey.length ) ? { args, failHelpKey } : { args } );
	},

	pushUpstreamMaster() {
		return git.push( "upstream master", false, "gitPushUpstreamFeatureBranch" );
	},

	pushUpstreamMasterWithTags() {
		return git.push( "upstream master", true );
	},

	pushOriginMaster() {
		return git.push( "origin master", false );
	},

	pushOriginMasterWithTags() {
		return git.push( "origin master", true );
	},

	pushUpstreamDevelop() {
		return git.push( "upstream develop", false );
	},

	uncommittedChangesExist() {
		const args = "diff-index HEAD --";
		return git.runCommand( { args, logMessage: "Checking for uncommitted changes" } );
	},

	stash() {
		const args = "stash";
		return git.runCommand( { args, logMessage: "Stashing uncommitted changes" } );
	},

	branchExists( branch ) {
		const args = `branch --list ${ branch }`;
		return git.runCommand( { args, logMessage: `Verifying branch: "${ branch }" exists` } ).then( result => {
			const branches = result.split( "\n" ).filter( String );
			return Promise.resolve( !!branches.length );
		} );
	},

	createLocalBranch( branch ) {
		const args = `branch ${ branch } upstream/${ branch }`;
		return git.runCommand( { args, logMessage: `Creating local branch "${ branch }"` } );
	},

	resetBranch( branch ) {
		const args = `reset --hard upstream/${ branch }`;
		return git.runCommand( { args, logMessage: `Hard reset on branch: "${ branch }"` } );
	}
};

export default git;
