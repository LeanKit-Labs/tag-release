import test from "ava";
import sinon from "sinon";
import nodefn from "when/node";
import { git } from "../helpers/index.js";

const options = {
	log: "* Added last feature\n* Added second feature\n* Added first feature",
	versions: {
		newVersion: "0.1.1"
	},
	username: "someUser",
	token: "k0234f"

};
const utils = {
	log: {
		begin: sinon.spy(),
		end: sinon.spy()
	},
	prompt: sinon.spy( prompterQuestions => new Promise( resolve => {
		resolve( {
			name: "My Special Release"
		} );
	} ) ),
	readJSONFile: sinon.stub().returns( {
		name: "my-special-repo"
	} )
};
const lift = sinon.spy( nodefn, "lift" );
let GitHub = null;
const getGitHubMocks = ( shouldResolve = true ) => {
	const getRepo = sinon.stub().returns( {
		createRelease: sinon.spy( args => new Promise( ( resolve, reject ) => {
			if ( shouldResolve ) {
				resolve( {
					data: {
						html_url: "http://www.google.com" // eslint-disable-line
					}
				} );
			} else {
				reject( "error" );
			}
		} ) )
	} );

	return sinon.stub().returns( { getRepo } );
};
const logger = { log: sinon.spy() };

import { githubRelease, __RewireAPI__ as RewireAPI } from "../../src/sequence-steps";

test.beforeEach( t => {
	RewireAPI.__Rewire__( "utils", utils );
	RewireAPI.__Rewire__( "nodefn", { lift } );
	GitHub = getGitHubMocks();
	RewireAPI.__Rewire__( "GitHub", GitHub );
	RewireAPI.__Rewire__( "logger", logger );
} );

test.afterEach( t => {
	RewireAPI.__ResetDependency__( "utils" );
	RewireAPI.__ResetDependency__( "nodefn" );
	RewireAPI.__ResetDependency__( "GitHub" );
	RewireAPI.__ResetDependency__( "logger" );
} );

test( "githubRelease auths a GitHub client instance", t => {
	return githubRelease( [ git, options ] ).then( () => {
		t.truthy( GitHub.calledWithExactly( { token: "k0234f" } ) );
	} );
} );

test( "githubRelease identifies a default tag release name from recent commit", t => {
	const questions = [ {
		type: "input",
		name: "name",
		message: "What do you want to name the release?",
		default: "Added first feature"
	} ];

	return githubRelease( [ git, options ] ).then( () => {
		t.truthy( utils.prompt.calledWithExactly( questions ) );
	} );
} );

test( "githubRelease begins utils.log with git command", t => {
	return githubRelease( [ git, options ] ).then( () => {
		t.truthy( utils.log.begin.calledWithExactly( "release to github" ) );
	} );
} );

test( "githubRelease reads from local package.json to determine repo name", t => {
	return githubRelease( [ git, options ] ).then( () => {
		t.truthy( utils.readJSONFile.calledWithExactly( "./package.json" ) );
	} );
} );

test( "githubRelease creates repo object by providing username and package name", t => {
	const github = new GitHub();

	return githubRelease( [ git, options ] ).then( () => {
		t.truthy( github.getRepo.calledWithExactly( "someUser", "my-special-repo" ) );
	} );
} );

test( "githubRelease calls to API to create release on GitHub", t => {
	const github = new GitHub();
	const repository = github.getRepo();
	const args = {
		tag_name: "v0.1.1", // eslint-disable-line
		name: "My Special Release",
		body: "* Added last feature\n* Added second feature\n* Added first feature"
	};

	return githubRelease( [ git, options ] ).then( () => {
		t.truthy( repository.createRelease.calledWithExactly( args ) );
	} );
} );

test( "githubRelease logger.logs error when createRelease fails", t => {
	GitHub = getGitHubMocks( false );
	RewireAPI.__Rewire__( "GitHub", GitHub );

	return githubRelease( [ git, options ] ).then( () => {
		t.truthy( logger.log.called ); // eslint-disable-line
	} );
} );

test( "githubRelease ends utils.log after creating release", t => {
	return githubRelease( [ git, options ], () => {
		t.truthy( utils.log.end.called );
	} );
} );
