import test from "ava";
import sinon from "sinon";
import nodefn from "when/node";
import { git } from "../helpers/index.js";

const utils = {
	log: {
		begin: sinon.spy(),
		end: sinon.spy()
	},
	exec: sinon.spy( command => new Promise( () => {} ) ),
	readJSONFile: sinon.stub().returns( {
		version: "1.0.0"
	} ),
	writeJSONFile: sinon.spy(),
	advise: sinon.spy()
};
const lift = sinon.spy( nodefn, "lift" );
const inc = sinon.stub().returns( "1.1.0" );
const logger = { log: sinon.spy() };

import { updateVersion, __RewireAPI__ as RewireAPI } from "../../src/sequence-steps";

test.beforeEach( t => {
	RewireAPI.__Rewire__( "utils", utils );
	RewireAPI.__Rewire__( "nodefn", { lift } );
	RewireAPI.__Rewire__( "semver", { inc } );
	RewireAPI.__Rewire__( "logger", logger );
} );

test.afterEach( t => {
	RewireAPI.__ResetDependency__( "utils" );
	RewireAPI.__ResetDependency__( "nodefn" );
	RewireAPI.__ResetDependency__( "semver" );
	RewireAPI.__ResetDependency__( "logger" );
} );

test.serial( "updateVersion calls readJSONFile", t => {
	updateVersion( [ git, { release: "minor" } ] );
	t.truthy( utils.readJSONFile.calledWith( "./package.json" ) );
} );

test.serial( "updateVersion adds versions to options", t => {
	const options = { release: "minor" };
	updateVersion( [ git, options ] );
	t.truthy( options.versions, { oldVersion: "1.0.0", newVersion: "1.1.0" } );
} );

test.serial( "updateVersion passes options.release to semver.inc", t => {
	const options = { release: "minor" };
	updateVersion( [ git, options ] );
	t.truthy( inc.calledWith( "1.0.0", options.release ) );
} );

test.serial( "updateVersion calls writeJSONFile", t => {
	updateVersion( [ git, { release: "minor" } ] );
	t.truthy( utils.writeJSONFile.calledWith( "./package.json", { version: "1.1.0" } ) );
} );

test.serial( "updateVersion gives advise when utils.readJSONFile fails", t => {
	utils.readJSONFile = sinon.stub().throws();
	updateVersion( [ git, { release: "minor" } ] );
	t.truthy( utils.advise.called );
} );
