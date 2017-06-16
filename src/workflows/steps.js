import git from "../git";
import util from "../utils";
import semver from "semver";
import chalk from "chalk";
import logger from "better-console";
import GitHub from "github-api";

const CHANGELOG_PATH = "./CHANGELOG.md";

export function getFeatureBranch( state ) {
	return git.getCurrentBranch().then( branch => {
		state.branch = branch.trim();
	} );
}

export function gitFetchUpstreamMaster( state ) {
	return git.fetchUpstreamMaster();
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

export function checkHasDevelopBranch( state ) {
	return git.getRemoteBranches().then( data => {
		const branches = data.split( "\n" );
		state.hasDevelopBranch = branches.some( branch => ~branch.trim().indexOf( "upstream/develop" ) );
	} ).catch( () => {
		state.hasDevelopBranch = false;
	} );
}

export function askPrereleaseIdentifier( state ) {
	const { identifier } = state;

	if ( identifier && identifier.length ) {
		return Promise.resolve();
	}

	return util.prompt( [ {
		type: "input",
		name: "prereleaseIdentifier",
		message: "Pre-release Identifier:"
	} ] ).then( response => {
		state.identifier = response.prereleaseIdentifier;
		return Promise.resolve();
	} );
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

	if ( ~contents.indexOf( "### Next" ) ) {
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
		contents = `## ${ wildcardVersion }\n\n${ update}\n`;
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
		if ( !exists ) {
			return git.createLocalBranch( "develop" );
		}
	} );
}

export function gitResetMaster( state ) {
	return git.resetBranch( "master" );
}

export function gitResetDevelop( state ) {
	return git.resetBranch( "develop" );
}
