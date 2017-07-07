import util from "./utils";
import path from "path";
import semver from "semver";

const DEFAULT_PRERELEASE_TAG_LIST_LIMIT = 10;

const git = {
	runCommand( { args, showOutput = true, logMessage, failHelpKey = "gitCommandFailed", exitOnFail = false, showError = true, fullCommand = false } ) {
		const command = fullCommand ? `${ args }` : `git ${ args }`;

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

				if ( !showError ) {
					return Promise.reject();
				}

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

	rebase( branch ) {
		const args = `rebase ${ branch }`;
		return git.runCommand( { args } );
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

	mergePromotionBranch( tag ) {
		return git.merge( `promote-release-${ tag }` );
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

	getPrereleaseTagList( limit = DEFAULT_PRERELEASE_TAG_LIST_LIMIT ) {
		const args = "tag --sort=-v:refname";
		return git.runCommand( { args, logMessage: "Getting list of pre-releases" } ).then( tagList => {
			const tags = tagList.split( "\n" );
			const prereleaseTags = tags.filter( tag => tag.includes( "-" ) ).map( tag => tag.trim() );

			const latestTags = prereleaseTags.reduce( ( acc, cur ) => {
				const key = cur.slice( 0, cur.lastIndexOf( "." ) );
				if ( acc[ key ] ) {
					acc[ key ] = semver.compare( acc[ key ], cur ) >= 0 ? acc[ key ] : cur;
				} else {
					acc[ key ] = cur;
				}
				return acc;
			}, {} );

			const flattened = Object.keys( latestTags ).map( key => {
				return latestTags[ key ];
			} );

			return Promise.resolve( flattened.slice( 0, limit ) );
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
	},

	checkoutTag( tag ) {
		const args = `checkout -b promote-release-${ tag } ${ tag }`;
		return git.runCommand( { args } );
	},

	generateRebaseCommitLog( tag ) {
		tag = tag.slice( 1, tag.lastIndexOf( "." ) ); // remove the 'v' and version of pre-release that it is eg. .0, .1, .2, etc...

		const args = `log upstream/master..HEAD --pretty=format:'%h %s' --no-merges`;
		return git.runCommand( { args } ).then( result => {
			let commits = result.split( "\n" );

			commits = commits.reduce( ( memo, commit ) => {
				if ( !commit.includes( tag ) ) {
					memo.push( `pick ${ commit }`.trim() );
				}
				return memo;
			}, [] );

			// adding a '\n' at the end of the .reverse().join() statement is required as the rebase -i file requires it to be there or
			// it will remove the last line in the file, which would be a whole commit potentially.
			util.writeFile( path.join( __dirname, ".commits-to-rebase.txt" ), `${ commits.reverse().join( "\n" ) }\n` );
		} );
	},

	removePreReleaseCommits() {
		const args = `GIT_SEQUENCE_EDITOR="cat ${ path.join( __dirname, ".commits-to-rebase.txt" ) } >" git rebase -i upstream/master`;
		return git.runCommand( { args, logMessage: "Removing pre-release commit history", failHelpKey: "gitRebaseInteractive", showError: false, fullCommand: true } );
	},

	rebaseUpstreamMaster() {
		return git.rebase( "upstream/master" );
	},

	getBranchList() {
		const args = "branch";
		return git.runCommand( { args, logMessage: "Getting branch list" } ).then( branches => {
			branches = branches.trim();
			branches = branches.split( "\n" );
			branches = branches.map( branch => branch.trim() );
			return Promise.resolve( branches );
		} );
	},

	removePromotionBranches() {
		return git.getBranchList().then( branches => {
			branches = branches.filter( branch => branch.includes( "promote-release" ) );
			return Promise.all( branches.map( branch => ( git.deleteBranch( branch, false ) ) ) );
		} );
	},

	deleteBranch( branch, showOutput = true ) {
		const args = `branch -D ${ branch }`;
		return git.runCommand( { args, showOutput } );
	},

	stageFiles() {
		const args = `add -A`;
		return git.runCommand( { args } );
	},

	rebaseContinue() {
		const args = `GIT_EDITOR="cat" git rebase --continue`;
		return git.runCommand( { args, logMessage: "Continuing with rebase", failHelpKey: "gitRebaseInteractive", showError: false, fullCommand: true } );
	},

	checkConflictMarkers() {
		const args = `diff --check`;
		return git.runCommand( { args, logMessage: "Verifying conflict resolution", failHelpKey: "gitCheckConflictMarkers", showError: false } );
	}

};

export default git;
