import test from "ava";
import sinon from "sinon";
import "sinon-as-promised";
import nodefn from "when/node";
import { git } from "../helpers/index.js";

const options = {
	log: "* Added last feature\n* Added second feature\n* Added first feature",
	versions: {
		newVersion: "0.1.1"
	},
	github: { owner: "someUser", name: "my-special-repo" },
	token: "k0234f"

};
const utils = {
	log: {
		begin: sinon.spy(),
		end: sinon.spy()
	},
	prompt: sinon.stub().resolves( {
		name: "My Special Release"
	} )
};
const lift = sinon.spy( nodefn, "lift" );
let GitHub = null;
let createRelease = null;
let getRepo = null;
function getCreateRelease( shouldResolve = true ) {
	const create = sinon.stub();
	if ( shouldResolve ) {
		create.resolves( {
			data: {
				html_url: "http://www.google.com" // eslint-disable-line
			}
		} );
	} else {
		create.rejects( "error" );
	}
	return create;
}
const getGitHubMocks = ( shouldResolve = true ) => {
	createRelease = getCreateRelease( shouldResolve );
	getRepo = sinon.spy( () => ( {
		createRelease
	} ) );

	return sinon.spy( () => ( { getRepo } ) );
};
const logger = { log: sinon.spy() };
const chalk = { red: sinon.stub() };

import { githubRelease, __RewireAPI__ as RewireAPI } from "../../src/sequence-steps";

test.beforeEach( t => {
	RewireAPI.__Rewire__( "utils", utils );
	RewireAPI.__Rewire__( "nodefn", { lift } );
	GitHub = getGitHubMocks();
	RewireAPI.__Rewire__( "GitHub", GitHub );
	RewireAPI.__Rewire__( "logger", logger );
	RewireAPI.__Rewire__( "chalk", chalk );
} );

test.afterEach( t => {
	RewireAPI.__ResetDependency__( "utils" );
	RewireAPI.__ResetDependency__( "nodefn" );
	RewireAPI.__ResetDependency__( "GitHub" );
	RewireAPI.__ResetDependency__( "logger" );
	RewireAPI.__ResetDependency__( "chalk" );
} );

test.serial( "githubRelease auths a GitHub client instance", t => {
	return githubRelease( [ git, options ] ).then( () => {
		t.truthy( GitHub.calledWithExactly( { token: "k0234f" } ) );
	} );
} );

test.serial( "githubRelease identifies a default tag release name from recent commit", t => {
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

test.serial( "githubRelease begins utils.log with git command", t => {
	return githubRelease( [ git, options ] ).then( () => {
		t.truthy( utils.log.begin.calledWithExactly( "release to github" ) );
	} );
} );

test.serial( "githubRelease creates repo object by providing username and package name", t => {
	return githubRelease( [ git, options ] ).then( () => {
		t.truthy( getRepo.calledWithExactly( "someUser", "my-special-repo" ) );
	} );
} );

test.serial( "githubRelease calls to API to create release on GitHub", t => {
	const args = {
		tag_name: "v0.1.1", // eslint-disable-line
		name: "My Special Release",
		body: "* Added last feature\n* Added second feature\n* Added first feature"
	};

	return githubRelease( [ git, options ] ).then( () => {
		t.truthy( createRelease.calledWithExactly( args ) );
	} );
} );

test.serial( "githubRelease ends utils.log after creating release", t => {
	return githubRelease( [ git, options ] ).then( () => {
		t.truthy( utils.log.end.called );
	} );
} );

test.serial( "githubRelease logger.logs error when createRelease fails", t => {
	GitHub = getGitHubMocks( false );
	RewireAPI.__Rewire__( "GitHub", GitHub );

	return githubRelease( [ git, options ] ).then( () => {
		t.truthy( chalk.red.called ); // eslint-disable-line
	} );
} );
