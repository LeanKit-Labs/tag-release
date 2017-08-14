import git from "../git";
import util from "../utils";
import semver from "semver";
import chalk from "chalk";
import logger from "better-console";
import GitHub from "github-api";
import sequence from "when/sequence";
import path from "path";
import removeWords from "remove-words";

const CHANGELOG_PATH = "./CHANGELOG.md";

export function getFeatureBranch( state ) {
	return git.getCurrentBranch().then( branch => {
		state.branch = branch.trim();
	} );
}

export function gitFetchUpstream( state ) {
	return git.fetchUpstream();
}

export function gitMergeUpstreamBranch( state ) {
	const { branch } = state;
	return git.merge( `upstream/${ branch }`, true, "gitMergeUpstreamBranch" );
}

export function gitMergeUpstreamMaster( state ) {
	return git.mergeUpstreamMaster();
}

export function gitMergeUpstreamDevelop( state ) {
	const { hasDevelopBranch } = state;

	return hasDevelopBranch ? git.mergeUpstreamDevelop() : Promise.resolve();
}

export function gitMergePromotionBranch( state ) {
	return git.mergePromotionBranch( state.promote );
}

export function checkHasDevelopBranch( state ) {
	return git.getRemoteBranches().then( data => {
		const branches = data.split( "\n" );
		state.hasDevelopBranch = branches.some( branch => branch.trim().includes( "upstream/develop" ) );
	} ).catch( () => {
		state.hasDevelopBranch = false;
	} );
}

export function setPrereleaseIdentifier( state ) {
	const { identifier } = state;

	const cleanIdentifier = targetIdentifier => {
		return targetIdentifier.replace( /^(defect|feature|rework)-/, "" );
	};

	if ( identifier && identifier.length ) {
		state.identifier = cleanIdentifier( state.identifier );
		return Promise.resolve();
	}

	return util.prompt( [ {
		type: "input",
		name: "prereleaseIdentifier",
		message: "Pre-release Identifier:"
	} ] ).then( response => {
		state.identifier = cleanIdentifier( response.prereleaseIdentifier );
		return Promise.resolve();
	} );
}

export function selectPrereleaseToPromote( state ) {
	if ( state.promote && typeof state.promote === "boolean" ) {
		return git.getPrereleaseTagList().then( prereleases => {
			return util.prompt( [ {
				type: "list",
				name: "prereleaseToPromote",
				message: "Select the pre-release you wish to promote:",
				choices: prereleases
			} ] ).then( ( { prereleaseToPromote: selectedPrerelease } ) => {
				state.promote = selectedPrerelease;
				return Promise.resolve();
			} );
		} );
	}

	return Promise.resolve();
}

export function gitCheckoutMaster( state ) {
	state.branch = "master";
	return git.checkoutMaster();
}

export function getCurrentBranchVersion( state ) {
	const { configPath } = state;

	let pkg = {};
	try {
		pkg = util.readJSONFile( configPath );
	} catch ( err ) {
		util.advise( "updateVersion" );
	}

	state.currentVersion = pkg.version;
	return Promise.resolve();
}

export function gitShortLog( state ) {
	const { currentVersion, prerelease } = state;

	let contents = util.readFile( CHANGELOG_PATH );

	if ( contents.includes( "### Next" ) ) {
		contents = contents.replace( /### Next([^#]+)/, ( match, submatch ) => {
			state.log = submatch.trim();
			return "";
		} );

		util.writeFile( CHANGELOG_PATH, contents );
	} else {
		return git.getTagList().then( tags => {
			let latestRelease = `v${ currentVersion }`;
			if ( tags.length ) {
				if ( !prerelease ) {
					tags = tags.filter( tag => !tag.includes( "-" ) );
					latestRelease = tags[ tags.length - 1 ];
				}
			}

			return git.shortLog( latestRelease ).then( data => {
				data = data.trim().replace( /^(.+)$/gm, "* $1" );
				if ( !data.length ) {
					util.advise( "gitLog.log", { exit: false } );
				}

				state.log = data;
			} );
		} ).catch( () => util.advise( "gitLog.log" ) );
	}
}

export function previewLog( { log } ) {
	logger.log( `${ chalk.bold( "Here is a preview of your log:" ) }
${ chalk.green( log ) }` );
}

export function askSemverJump( state ) {
	const { currentVersion, identifier, prerelease, release } = state;

	// don't bother prompting if this information was already provided in the CLI options
	if ( release && release.length ) {
		return Promise.resolve();
	}

	const releaseChoices = [
		{ name: "Major (Breaking Change)", value: "major", short: "l" },
		{ name: "Minor (New Feature)", value: "minor", short: "m" },
		{ name: "Patch (Bug Fix)", value: "patch", short: "s" }
	];

	const prereleaseChoices = [
		{ name: "Pre-major (Breaking Change)", value: "premajor", short: "p-l" },
		{ name: "Pre-minor (New Feature)", value: "preminor", short: "p-m" },
		{ name: "Pre-patch (Bug Fix)", value: "prepatch", short: "p-s" },
		{ name: "Pre-release (Bump existing Pre-release)", value: "prerelease", short: "p-r" }
	];

	const choicesSource = prerelease ? prereleaseChoices : releaseChoices;

	const choices = choicesSource.map( item => {
		const version = `v${ semver.inc( currentVersion, item.value, identifier ) }`;
		return Object.assign( {}, item, { name: `${ item.name } ${ chalk.gray( version ) }` } );
	} );

	return util.prompt( [ {
		type: "list",
		name: "release",
		message: "What type of release is this",
		choices
	} ] ).then( answers => {
		state.release = answers.release;
		return Promise.resolve();
	} );
}

export function updateLog( state ) {
	return util.prompt( [ {
		type: "confirm",
		name: "log",
		message: "Would you like to edit your log",
		default: true
	} ] ).then( answers => {
		util.log.begin( "log preview" );
		if ( answers.log ) {
			return util.editLog( state.log ).then( data => {
				state.log = data.trim();
				util.log.end();
			} );
		}

		return Promise.resolve();
	} );
}

export function updateVersion( state ) {
	const { configPath, currentVersion, identifier, release } = state;

	let pkg = {};
	try {
		pkg = util.readJSONFile( configPath );
	} catch ( err ) {
		util.advise( "updateVersion" );
	}

	const oldVersion = currentVersion;
	const newVersion = pkg.version = semver.inc( oldVersion, release, identifier );

	util.writeJSONFile( configPath, pkg );
	state.versions = { oldVersion, newVersion };
	logger.log( chalk.green( `Updated ${ configPath } from ${ oldVersion } to ${ newVersion }` ) );
}

export function updateChangelog( state ) {
	const { log, release, versions: { newVersion } } = state;
	const version = `### ${ newVersion }`;
	const update = `${ version }\n\n${ log }`;
	const wildcardVersion = newVersion.replace( /\.\d+\.\d+/, ".x" );
	const command = "update changelog";

	util.log.begin( command );
	let contents = util.readFile( CHANGELOG_PATH );

	if ( release === "major" ) {
		contents = `## ${ wildcardVersion }\n\n${ update }\n\n${ contents }`;
	} else {
		contents = contents ?
			contents.replace( /(## .*\n)/, `$1\n${ update }\n` ) :
			`## ${ wildcardVersion }\n\n${ update }\n`;
	}

	util.writeFile( CHANGELOG_PATH, contents );
	util.log.end();
}

export function gitDiff( state ) {
	const { configPath } = state;

	return git.diff( [ CHANGELOG_PATH, configPath ] ).then( diff => {
		logger.log( diff );
		return util.prompt( [ {
			type: "confirm",
			name: "proceed",
			message: "Are you OK with this diff?",
			default: true
		} ] ).then( answers => {
			util.log.begin( "confirming changes to commit" );
			util.log.end();

			if ( !answers.proceed ) {
				process.exit( 0 ); // eslint-disable-line no-process-exit
			}
		} );
	} );
}

export function gitAdd( state ) {
	const { configPath } = state;

	return git.add( [ CHANGELOG_PATH, configPath ] );
}

export function gitCommit( state ) {
	const { versions: { newVersion } } = state;

	return git.commit( newVersion );
}

export function gitTag( state ) {
	const { versions: { newVersion } } = state;
	const tag = `v${ newVersion }`;

	return git.tag( tag, tag );
}

export function gitPushUpstreamMaster() {
	return git.pushUpstreamMasterWithTags();
}

export function npmPublish( state ) {
	const { configPath } = state;
	if ( configPath !== "./package.json" ) {
		return null;
	}

	const command = `npm publish`;

	if ( !util.isPackagePrivate( configPath ) ) {
		return util.getPackageRegistry( configPath ).then( registry => {
			return util.prompt( [ {
				type: "confirm",
				name: "publish",
				message: `Do you want to publish this package to ${ registry }?`,
				default: true
			} ] ).then( answers => {
				if ( answers.publish ) {
					util.log.begin( command );
					return util.exec( command )
						.then( () => util.log.end() )
						.catch( () => util.advise( "npmPublish", { exit: false } ) );
				}
			} );
		} ).catch( err => logger.log( chalk.red( err ) ) );
	}
}

export function gitCheckoutDevelop( state ) {
	const { hasDevelopBranch } = state;

	if ( hasDevelopBranch ) {
		return git.checkoutDevelop();
	}
}

export function gitMergeMaster( state ) {
	const { hasDevelopBranch } = state;

	if ( hasDevelopBranch ) {
		return git.mergeMaster();
	}
}

export function gitPushUpstreamDevelop( state ) {
	const { hasDevelopBranch } = state;

	if ( hasDevelopBranch ) {
		return git.pushUpstreamDevelop();
	}
}

export function gitPushUpstreamFeatureBranch( state ) {
	const { branch } = state;

	if ( branch && branch.length ) {
		return git.push( `upstream ${ branch }` );
	}
}

export function gitForcePushUpstreamFeatureBranch( state ) {
	const { branch } = state;

	if ( branch && branch.length ) {
		return git.push( `-f upstream ${ branch }` );
	}
}

export function gitPushOriginMaster( state ) {
	return git.pushOriginMaster();
}

export function githubUpstream( state ) {
	const command = `git config remote.upstream.url`;
	return util.exec( command ).then( data => {
		const [ , owner, name ] = data.match( /github\.com[:\/](.*)\/(.*(?=\.git)|(?:.*))/ ) || [];
		state.github = { owner, name };
	} ).catch( error => logger.log( "error", error ) );
}

export function githubRelease( state ) {
	const { github: { owner: repositoryOwner, name: repositoryName }, log, prerelease, token, versions: { newVersion } } = state;
	const tagName = `v${ newVersion }`;
	const github = new GitHub( { token } );
	const defaultName = log.split( "\n" ).pop().replace( "* ", "" );
	const questions = [ {
		type: "input",
		name: "name",
		message: "What do you want to name the release?",
		default: defaultName
	} ];

	return util.prompt( questions ).then( answers => {
		util.log.begin( "release to github" );
		const repository = github.getRepo( repositoryOwner, repositoryName );
		const args = {
			tag_name: tagName, // eslint-disable-line
			name: answers.name,
			body: log,
			prerelease
		};

		return repository.createRelease( args ).then( response => {
			util.log.end();
			logger.log( chalk.yellow.underline.bold( response.data.html_url ) );
		} ).catch( err => logger.log( chalk.red( err ) ) );
	} );
}

export function checkForUncommittedChanges( state ) {
	return git.uncommittedChangesExist().then( results => {
		state.uncommittedChangesExist = results.length;
		return Promise.resolve( state.uncommittedChangesExist );
	} );
}

export function gitStash( state ) {
	return git.stash().then( () => {
		util.advise( "gitStash", { exit: false } );
		return Promise.resolve();
	} );
}

export function stashIfUncommittedChangesExist( state ) {
	const { uncommittedChangesExist } = state;
	if ( uncommittedChangesExist ) {
		return gitStash();
	}
}

export function verifyMasterBranch( state ) {
	return git.branchExists( "master" ).then( exists => {
		if ( !exists ) {
			return git.createLocalBranch( "master" );
		}
	} );
}

export function verifyDevelopBranch( state ) {
	return git.branchExists( "develop" ).then( exists => {
		if ( !exists && state.hasDevelopBranch ) {
			return git.createLocalBranch( "develop" );
		}
	} );
}

export function gitResetMaster( state ) {
	return git.resetBranch( "master" );
}

export function gitResetDevelop( state ) {
	if ( state.hasDevelopBranch ) {
		return git.resetBranch( "develop" );
	}
	return Promise.resolve();
}

export function gitCheckoutTag( state ) {
	if ( state.promote.charAt( 0 ) !== "v" ) {
		state.promote = `v${ state.promote }`;
	}

	return git.checkoutTag( state.promote );
}

export function gitGenerateRebaseCommitLog( state ) {
	return git.generateRebaseCommitLog( state.promote );
}

export function gitRemovePreReleaseCommits() {
	return git.removePreReleaseCommits();
}

export function gitRebaseUpstreamMaster() {
	return git.rebaseUpstreamMaster();
}

export function gitRemovePromotionBranches() {
	return git.removePromotionBranches();
}

export function gitStageFiles() {
	return git.stageFiles();
}

export function gitRebaseContinue() {
	return git.rebaseContinue();
}

export function setPromote( state ) {
	state.promote = state.branch.slice( state.branch.indexOf( "v" ), state.branch.length ); // retrieve from promote-release branch, e.g. v1.1.1-feature.0
	return Promise.resolve();
}

export function verifyConflictResolution() {
	return git.checkConflictMarkers();
}

export function getPackageScope( state ) {
	const defaultOrProvidedScope = flag => {
		return flag.charAt( 0 ) === "@" ? `${ flag }` : `@${ flag }`;
	};
	const content = util.readJSONFile( path.join( __dirname, ".state.txt" ) );
	state.scope = content.scope ? content.scope : "@lk";

	if ( state.qa && typeof state.qa !== "boolean" ) {
		state.scope = defaultOrProvidedScope( state.qa );
	} else if ( state.pr && typeof state.pr !== "boolean" ) {
		state.scope = defaultOrProvidedScope( state.pr );
	}

	return Promise.resolve();
}

export function getScopedRepos( state ) {
	const { configPath, scope } = state;
	try {
		let content = {};
		content = util.readJSONFile( configPath );

		const getScopedDependencies = ( dependencies = {}, packageScope ) =>
			Object.keys( dependencies ).filter( key => key.includes( packageScope ) );

		let repos = getScopedDependencies( content.devDependencies, scope );
		repos = [ ...repos, ...getScopedDependencies( content.dependencies, scope ) ];
		repos = repos.map( key => key.replace( `${ scope }/`, "" ) );

		if ( repos.length === 0 ) {
			util.advise( "noPackagesInScope" );
			process.exit( 0 ); // eslint-disable-line no-process-exit
		}

		return Promise.resolve( repos );
	} catch ( err ) {
		util.advise( "updateVersion" );
	}

	return Promise.resolve();
}

export function askReposToUpdate( state ) {
	return getScopedRepos( state ).then( packages => {
		return util.prompt( [ {
			type: "checkbox",
			name: "packagesToPromote",
			message: "Select the package(s) you wish to update:",
			choices: packages
		} ] ).then( ( { packagesToPromote } ) => {
			state.packages = packagesToPromote;
			return Promise.resolve();
		} );
	} );
}

export function askVersion( state, dependency ) {
	const { pkg, version } = dependency;
	return () => {
		return getTagsFromRepo( state, pkg ).then( tags => {
			return util.prompt( [ {
				type: "list",
				name: "tag",
				message: `Update ${ chalk.yellow( pkg ) } from ${ chalk.yellow( version ) } to:`,
				choices: tags
			} ] ).then( ( { tag } ) => {
				return Promise.resolve( { pkg, version: tag } );
			} );
		} );
	};
}

export function askVersions( state ) {
	const { dependencies } = state;
	const prompts = dependencies.map( dependency => askVersion( state, dependency ) );

	return sequence( prompts ).then( deps => {
		state.dependencies = deps;

		const tagIdentifier = /^\d+\.\d+\.\d+\-(.+)\.\d+$/;
		state.identifier = deps.reduce( ( memo, dep ) => {
			const { version } = dep;
			const [ tag, identifier ] = tagIdentifier.exec( version ) || [];
			if ( tag && identifier && !memo.includes( identifier ) ) {
				memo.push( identifier );
			}
			return memo;
		}, [] )[ 0 ] || "";

		if ( !state.identifier ) {
			state.identifier = removeWords( state.changeReason ).join( "-" );
		}

		return Promise.resolve();
	} );
}

export function askChangeType( state ) {
	return util.prompt( [ {
		type: "list",
		name: "changeType",
		message: "What type of change is this work",
		choices: [ "feature", "defect", "rework" ]
	} ] ).then( ( { changeType } ) => {
		state.changeType = changeType;
		return Promise.resolve();
	} );
}

export function askChangeReason( state ) {
	return util.prompt( [ {
		type: "input",
		name: "changeReason",
		message: "What is the reason for this change"
	} ] ).then( ( { changeReason } ) => {
		state.changeReason = changeReason;
		return Promise.resolve();
	} );
}

export function gitCheckoutAndCreateBranch( state ) {
	return git.checkoutAndCreateBranch( state.branch );
}

export function updateDependencies( state ) {
	const { dependencies, configPath, scope } = state;
	try {
		let content = {};
		content = util.readJSONFile( configPath );

		dependencies.forEach( item => {
			const key = `${ scope }/${ item.pkg }`;
			if ( content.devDependencies && key in content.devDependencies ) {
				content.devDependencies[ key ] = item.version;
			}
			if ( content.dependencies && key in content.dependencies ) {
				content.dependencies[ key ] = item.version;
			}
		} );

		util.writeJSONFile( configPath, content );
	} catch ( err ) {
		util.advise( "updateVersion" );
	}

	return Promise.resolve();
}

export function gitCommitBumpMessage( state ) {
	const { dependencies, changeReason } = state;
	const arr = [];
	dependencies.forEach( item => {
		arr.push( `${ item.pkg } to ${ item.version }` );
	} );

	state.bumpComment = `Bumped ${ arr.join( ", " ) }: ${ changeReason }`;

	return git.commit( state.bumpComment );
}

export function gitCreateUpstreamBranch( state ) {
	return git.createUpstreamBranch( state.branch );
}

export function verifyPackagesToPromote( state ) {
	const { packages } = state;
	if ( packages && packages.length === 0 ) {
		util.advise( "noPackages" );
		process.exit( 0 ); // eslint-disable-line no-process-exit
	}

	return Promise.resolve();
}

export function gitRebaseUpstreamBranch( state ) {
	const { branch } = state;
	return git.rebaseUpstreamBranch( branch );
}

export function gitRebaseUpstreamDevelop() {
	return git.rebaseUpstreamDevelop();
}

export function getReposFromBumpCommit( state ) {
	return git.getLatestCommitMessage().then( msg => {
		const [ , versions = "", reason = "" ] = msg.match( /Bumped (.*): (.*)/ ) || [];
		const repoVersion = /([\w-]+) to ([\d.]+)/;
		const results = versions.split( "," ).reduce( ( memo, bump ) => {
			const [ , repo, version ] = repoVersion.exec( bump ) || [];
			if ( repo && version ) {
				memo.push( repo );
			}
			return memo;
		}, [] );

		state.packages = results;
		state.changeReason = reason;

		return Promise.resolve();
	} );
}

export function gitAmendCommitBumpMessage( state ) {
	const { dependencies, changeReason } = state;
	const arr = [];
	dependencies.forEach( item => {
		arr.push( `${ item.pkg } to ${ item.version }` );
	} );

	state.bumpComment = `Bumped ${ arr.join( ", " ) }: ${ changeReason }`;

	return git.amend( state.bumpComment );
}

export function getCurrentDependencyVersions( state ) {
	const { packages, configPath, scope } = state;
	state.dependencies = [];

	try {
		let content = {};
		content = util.readJSONFile( configPath );

		packages.forEach( pkg => {
			const key = `${ scope }/${ pkg }`;
			if ( content.devDependencies && key in content.devDependencies ) {
				state.dependencies.push( { pkg, version: content.devDependencies[ key ] } );
			}
			if ( content.dependencies && key in content.dependencies ) {
				state.dependencies.push( { pkg, version: content.dependencies[ key ] } );
			}
		} );
	} catch ( err ) {
		util.advise( "updateVersion" );
	}

	return Promise.resolve();
}

export function createGithubPullRequestAganistDevelop( state ) {
	const { github: { owner: repositoryOwner, name: repositoryName }, token, branch } = state;
	const github = new GitHub( { token } );
	util.log.begin( "creating pull request to github" );

	const repository = github.getRepo( repositoryOwner, repositoryName );

	const options = {
		title: state.bumpComment,
		head: `${ repositoryOwner }:${ branch }`,
		base: "develop"
	};

	return repository.createPullRequest( options ).then( response => {
		const { number, html_url: url } = response.data; // eslint-disable-line camelcase
		const issues = github.getIssues( repositoryOwner, repositoryName );
		return issues.editIssue( number, { labels: [ "Ready to Merge Into Develop" ] } ).then( result => {
			util.log.end();
			logger.log( chalk.yellow.underline.bold( url ) );
		} ).catch( err => logger.log( chalk.red( err ) ) );
	} ).catch( err => logger.log( chalk.red( err ) ) );
}

export function saveState( state ) {
	const { scope } = state;
	try {
		const content = {
			scope
		};

		util.writeJSONFile( path.join( __dirname, ".state.txt" ), content );
	} catch ( err ) {
		util.advise( "saveState" );
	}

	return Promise.resolve();
}

export function cleanUpTmpFiles( state ) {
	util.deleteFile( path.join( __dirname, ".state.txt" ) );

	return git.cleanUp();
}

export function promptBranchName( state ) {
	return util.prompt( [ {
		type: "input",
		name: "branchName",
		message: "What do you want your branch name to be?",
		default: `${ state.changeType }-${ state.identifier }`
	} ] ).then( ( { branchName } ) => {
		state.branch = branchName;
		return Promise.resolve();
	} );
}

export function gitCheckoutBranch( state ) {
	return git.checkoutBranch( state.branch );
}

export function getTagsFromRepo( state, repositoryName ) {
	const { github: { owner: repositoryOwner }, token } = state;
	const github = new GitHub( { token } );

	const repository = github.getRepo( repositoryOwner, repositoryName );

	return repository.listTags().then( response => {
		const tags = response.data.map( item => {
			return item.name.slice( 1, item.name.length ); // slice off the 'v' that is returned in the tag
		} );
		return tags;
	} ).catch( err => logger.log( chalk.red( err ) ) );
}

export function abortIfDevelopOrMaster( state ) {
	if ( state.branch === "develop" || state.branch === "master" ) {
		util.advise( "abortIfDevelopOrMaster" );
	}

	return Promise.resolve();
}
