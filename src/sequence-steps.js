/* eslint no-console: 0 */

"use strict";

const utils = require( "./utils" );
const nodefn = require( "when/node" );
const semver = require( "semver" );

const CHANGELOG_PATH = "./CHANGELOG.md";
const sequenceSteps = [
	gitFetchUpstreamMaster,
	gitCheckoutMaster,
	gitMergeUpstreamMaster,
	gitMergeUpstreamDevelop,
	updateVersion,
	gitLog,
	updateLog,
	updateChangelog,
	gitDiff,
	gitAdd,
	gitCommit,
	gitTag,
	gitPushUpstreamMaster,
	npmPublish,
	gitCheckoutDevelop,
	gitMergeMaster,
	gitPushUpstreamDevelop,
	gitPushOriginMaster
];

function gitFetchUpstreamMaster() {
	const command = "git fetch upstream --tags";

	utils.log.begin( command );

	return utils.exec( command ).then( () => utils.log.end() );
}

function gitCheckoutMaster( args ) {
	const git = args[ 0 ];
	const command = "git checkout master";

	utils.log.begin( command );

	return nodefn.lift( git.checkout.bind( git ) )( "master" )
		.then( () => utils.log.end() );
}

function gitMergeUpstreamMaster( args ) {
	const git = args[ 0 ];
	const command = "git merge --ff-only upstream/master";

	utils.log.begin( command );

	return nodefn.lift( git.merge.bind( git ) )( [ "--ff-only", "upstream/master" ] )
		.then( () => utils.log.end() );
}

function gitMergeUpstreamDevelop( args ) {
	const git = args[ 0 ];
	const options = args[ 1 ];
	const command = "git merge upstream/develop";

	if ( options.develop ) {
		utils.log.begin( command );
		return nodefn.lift( git.merge.bind( git ) )( [ "upstream/develop" ] )
			.then( () => utils.log.end() );
	}

	return null;
}

function updateVersion( args ) {
	const options = args[ 1 ];
	const packageJson = utils.readJSONFile( "./package.json" );
	const oldVersion = packageJson.version;
	const newVersion = packageJson.version = semver.inc( oldVersion, options.release );

	utils.writeJSONFile( "./package.json", packageJson );
	options.versions = { oldVersion, newVersion };
	console.log( `Updated package.json from ${ oldVersion } to ${ newVersion }` );
}

function gitLog( args ) {
	let options = args[ 1 ];
	let contents = utils.readFile( CHANGELOG_PATH );

	if ( ~contents.indexOf( "### Next" ) ) {
		contents = contents.replace( /### Next([^#]+)/, ( match, submatch ) => {
			options.log = submatch.trim();
			return "";
		} );
		utils.writeFile( CHANGELOG_PATH, contents );
	} else {
		return utils.exec( "git tag --sort=v:refname" ).then( tags => {
			tags = tags.trim().split( "\n" );
			const latestRelease = tags[ tags.length - 1 ];
			const command = `git --no-pager log --no-merges --date-order --pretty=format:'%s' ${ latestRelease }..`;
			utils.log.begin( command );
			return utils.exec( command ).then( data => {
				data = data.trim().replace( /^(.+)$/gm, "* $1" );
				options.log = data;
				utils.log.end();
			} );
		} );
	}
}

function updateLog( args ) {
	const options = args[ 1 ];
	const command = "log preview";

	console.log( `Here is a preview of your log: \n${ options.log }` );

	return utils.prompt( [ {
		type: "confirm",
		name: "log",
		message: "Would you like to edit your log",
		default: true
	} ] ).then( answers => {
		utils.log.begin( command );
		if ( answers.log ) {
			return utils.editor( options.log )
				.then( data => {
					options.log = data.trim();
					utils.log.end();
				} );
		}
	} );
}

function updateChangelog( args ) {
	const options = args[ 1 ];
	const version = `### ${ options.versions.newVersion }`;
	const update = `${ version }\n\n${ options.log }`;
	const command = "update changelog";

	utils.log.begin( command );
	let contents = utils.readFile( CHANGELOG_PATH );
	if ( options.release === "major" ) {
		const wildcardVersion = options.versions.newVersion.replace( ".0.0", ".x" );
		contents = `## ${ wildcardVersion }\n\n${ update }\n\n${ contents }`;
	} else {
		contents = contents.replace( /(## .*\n)/, `$1\n${ update }\n` );
	}
	utils.writeFile( CHANGELOG_PATH, contents );
	utils.log.end();
}

function gitDiff() {
	const command = "git diff --color CHANGELOG.md package.json";

	return utils.exec( command )
		.then( data => {
			console.log( data );
			return utils.prompt( [ {
				type: "confirm",
				name: "proceed",
				message: "Are you okay with this diff",
				default: true
			} ] ).then( answers => {
				utils.log.begin( command );
				utils.log.end();
				if ( !answers.proceed ) {
					process.exit( 0 ); // eslint-disable-line no-process-exit
				}
			} );
		} );
}

function gitAdd( args ) {
	const git = args[ 0 ];
	const command = "git add CHANGELOG.md package.json";

	utils.log.begin( command );

	return nodefn.lift( git.add.bind( git ) )( [ "CHANGELOG.md", "package.json" ] )
		.then( () => utils.log.end() );
}

function gitCommit( args ) {
	const git = args[ 0 ];
	const options = args[ 1 ];
	const command = `git commit -m "${ options.versions.newVersion }"`;

	utils.log.begin( command );

	return nodefn.lift( git.commit.bind( git ) )( options.versions.newVersion )
		.then( () => utils.log.end() );
}

function gitTag( args ) {
	const git = args[ 0 ];
	const options = args[ 1 ];
	const command = `git tag -a v${ options.versions.newVersion } -m "..."`;

	utils.log.begin( command );

	return nodefn.lift( git.addAnnotatedTag.bind( git ) )( `v${ options.versions.newVersion }`, options.log )
		.then( () => utils.log.end() );
}

function gitPushUpstreamMaster() {
	const command = "git push upstream master --tags";

	utils.log.begin( command );

	return utils.exec( command )
		.then( data => utils.log.end() );
}

function npmPublish() {
	const command = `npm publish`;

	return utils.prompt( [ {
		type: "confirm",
		name: "publish",
		message: "Do you want to publish this package",
		default: true
	} ] ).then( answers => {
		utils.log.begin( command );
		if ( answers.publish ) {
			return utils.exec( command ).then( data => utils.log.end() );
		}
		utils.log.end();
	} );
}

function gitCheckoutDevelop( args ) {
	const git = args[ 0 ];
	const options = args[ 1 ];
	const command = `git checkout develop`;

	utils.log.begin( command );
	if ( options.develop ) {
		return nodefn.lift( git.checkout.bind( git ) )( "develop" )
			.then( () => utils.log.end() );
	}
	utils.log.end();

	return null;
}

function gitMergeMaster( args ) {
	const git = args[ 0 ];
	const options = args[ 1 ];
	const command = `git merge --ff-only master`;

	if ( options.develop ) {
		utils.log.begin( command );
		return nodefn.lift( git.merge.bind( git ) )( [ "--ff-only", "master" ] )
			.then( () => utils.log.end() );
	}

	return null;
}

function gitPushUpstreamDevelop( args ) {
	const git = args[ 0 ];
	const options = args[ 1 ];
	const command = `git push upstream develop`;

	if ( options.develop ) {
		utils.log.begin( command );
		return nodefn.lift( git.push.bind( git ) )( "upstream", "develop" )
			.then( () => utils.log.end() );
	}

	return null;
}

function gitPushOriginMaster( args ) {
	const git = args[ 0 ];
	const command = `git push origin master`;

	utils.log.begin( command );

	return nodefn.lift( git.push.bind( git ) )( "origin", "master" )
		.then( () => utils.log.end() );
}

module.exports = {
	sequenceSteps: sequenceSteps,
	gitFetchUpstreamMaster: gitFetchUpstreamMaster,
	gitCheckoutMaster: gitCheckoutMaster,
	gitMergeUpstreamMaster: gitMergeUpstreamMaster,
	gitMergeUpstreamDevelop: gitMergeUpstreamDevelop,
	updateVersion: updateVersion,
	gitLog: gitLog,
	updateLog: updateLog,
	updateChangelog: updateChangelog,
	gitDiff: gitDiff,
	gitAdd: gitAdd,
	gitCommit: gitCommit,
	gitTag: gitTag,
	gitPushUpstreamMaster: gitPushUpstreamMaster,
	npmPublish: npmPublish,
	gitCheckoutDevelop: gitCheckoutDevelop,
	gitMergeMaster: gitMergeMaster,
	gitPushUpstreamDevelop: gitPushUpstreamDevelop,
	gitPushOriginMaster: gitPushOriginMaster
}
