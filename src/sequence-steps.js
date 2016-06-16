/* eslint no-console: 0 */

import utils from "./utils";
import nodefn from "when/node";
import semver from "semver";
import chalk from "chalk";

const CHANGELOG_PATH = "./CHANGELOG.md";
const sequenceSteps = [
	gitFetchUpstreamMaster,
	gitBranchGrepUpstreamDevelop,
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

export function gitFetchUpstreamMaster( [ git, options ] ) {
	const command = "git fetch upstream --tags";
	utils.log.begin( command );
	return utils.exec( command ).then( () => utils.log.end() );
}

export function gitBranchGrepUpstreamDevelop( [ git, options ] ) {
	const command = `git branch -r | grep "upstream/develop"`;
	return utils.exec( command ).then( data => {
		options.develop = true;
	} ).catch( data => {
		options.develop = false;
	} );
}

export function gitCheckoutMaster( [ git, options ] ) {
	const command = "git checkout master";
	utils.log.begin( command );
	return nodefn.lift( ::git.checkout )( "master" )
		.then( () => utils.log.end() );
}

export function gitMergeUpstreamMaster( [ git, options ] ) {
	const command = "git merge --ff-only upstream/master";
	utils.log.begin( command );
	return nodefn.lift( ::git.merge )( [ "--ff-only", "upstream/master" ] )
		.then( () => utils.log.end() );
}

export function gitMergeUpstreamDevelop( [ git, options ] ) {
	const command = "git merge upstream/develop";
	if ( options.develop ) {
		utils.log.begin( command );
		return nodefn.lift( ::git.merge )( [ "upstream/develop" ] )
			.then( () => utils.log.end() );
	}
	return null;
}

export function updateVersion( [ git, options ] ) {
	const packageJson = utils.readJSONFile( "./package.json" );
	const oldVersion = packageJson.version;
	const newVersion = packageJson.version = semver.inc( oldVersion, options.release );
	utils.writeJSONFile( "./package.json", packageJson );
	options.versions = { oldVersion, newVersion };
	console.log( `Updated package.json from ${ oldVersion } to ${ newVersion }` );
}

export function gitLog( [ git, options ] ) {
	let contents = utils.readFile( CHANGELOG_PATH );

	if ( ~contents.indexOf( "### Next" ) ) {
		contents = contents.replace( /### Next([^#]+)/, ( match, submatch ) => {
			options.log = submatch.trim();
			return "";
		} );
		utils.writeFile( CHANGELOG_PATH, contents );
	} else {
		return utils.exec( "git tag --sort=v:refname" ).then( tags => {
			let command = `git --no-pager log --no-merges --date-order --pretty=format:'%s'`;
			tags = tags.trim();
			if ( tags.length ) {
				tags = tags.split( "\n" );
				const latestRelease = tags[ tags.length - 1 ];
				command = `${ command } ${ latestRelease }..`;
			}
			utils.log.begin( command );
			return utils.exec( command ).then( data => {
				data = data.trim().replace( /^(.+)$/gm, "* $1" );
				options.log = data;
				utils.log.end();
			} );
		} );
	}
}

export function updateLog( [ git, options ] ) {
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

export function updateChangelog( [ git, options ] ) {
	const version = `### ${ options.versions.newVersion }`;
	const update = `${ version }\n\n${ options.log }`;
	const command = "update changelog";
	utils.log.begin( command );
	let contents = utils.readFile( CHANGELOG_PATH );
	const wildcardVersion = options.versions.newVersion.replace( /\.\d+\.\d+/, ".x" );
	if ( options.release === "major" ) {
		contents = `## ${ wildcardVersion }\n\n${ update }\n\n${ contents }`;
	} else {
		contents = contents ?
			contents.replace( /(## .*\n)/, `$1\n${ update }\n` ) :
			`## ${ wildcardVersion }\n\n${ update }`;
	}
	utils.writeFile( CHANGELOG_PATH, contents );
	console.log( CHANGELOG_PATH, contents );
	utils.log.end();
}

export function gitDiff( [ git, options ] ) {
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

export function gitAdd( [ git, options ] ) {
	const command = "git add CHANGELOG.md package.json";
	utils.log.begin( command );
	return nodefn.lift( ::git.add )( [ "CHANGELOG.md", "package.json" ] )
		.then( () => utils.log.end() );
}

export function gitCommit( [ git, options ] ) {
	const command = `git commit -m "${ options.versions.newVersion }"`;
	utils.log.begin( command );
	return nodefn.lift( ::git.commit )( options.versions.newVersion )
		.then( () => utils.log.end() );
}

export function gitTag( [ git, options ] ) {
	const command = `git tag -a v${ options.versions.newVersion } -m "..."`;
	utils.log.begin( command );
	return nodefn.lift( ::git.addAnnotatedTag )( `v${ options.versions.newVersion }`, options.log )
		.then( () => utils.log.end() );
}

export function gitPushUpstreamMaster( [ git, options ] ) {
	const command = "git push upstream master --tags";
	utils.log.begin( command );
	return utils.exec( command )
		.then( data => utils.log.end() );
}

export function npmPublish( [ git, options ] ) {
	const command = `npm publish`;

	return utils.getPackageRegistry().then( registry => {
		return utils.prompt( [ {
			type: "confirm",
			name: "publish",
			message: `Do you want to publish this package to ${ registry }`,
			default: true
		} ] ).then( answers => {
			if ( answers.publish ) {
				utils.log.begin( command );
				return utils.exec( command ).then( data => utils.log.end() );
			}
		} );
	} ).catch( e => chalk.red( e ) );
}

export function gitCheckoutDevelop( [ git, options ] ) {
	const command = `git checkout develop`;
	if ( options.develop ) {
		utils.log.begin( command );
		return nodefn.lift( ::git.checkout )( "develop" )
			.then( () => utils.log.end() );
	}
	return null;
}

export function gitMergeMaster( [ git, options ] ) {
	const command = `git merge --ff-only master`;
	if ( options.develop ) {
		utils.log.begin( command );
		return nodefn.lift( ::git.merge )( [ "--ff-only", "master" ] )
			.then( () => utils.log.end() );
	}
	return null;
}

export function gitPushUpstreamDevelop( [ git, options ] ) {
	const command = `git push upstream develop`;
	if ( options.develop ) {
		utils.log.begin( command );
		return nodefn.lift( ::git.push )( "upstream", "develop" )
			.then( () => utils.log.end() );
	}
	return null;
}

export function gitPushOriginMaster( [ git, options ] ) {
	const command = `git push origin master`;
	utils.log.begin( command );
	return nodefn.lift( ::git.push )( "origin", "master" )
		.then( () => utils.log.end() );
}

export default sequenceSteps;
