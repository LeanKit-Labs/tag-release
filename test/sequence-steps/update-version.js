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
	writeJSONFile: sinon.spy()
};
const lift = sinon.spy( nodefn, "lift" );
const inc = sinon.stub().returns( "1.1.0" );

import { updateVersion, __RewireAPI__ as RewireAPI } from "../../src/sequence-steps";

test.beforeEach( t => {
	RewireAPI.__Rewire__( "utils", utils );
	RewireAPI.__Rewire__( "nodefn", { lift } );
	RewireAPI.__Rewire__( "semver", { inc } );
} );

test.afterEach( t => {
	RewireAPI.__ResetDependency__( "utils" );
	RewireAPI.__ResetDependency__( "nodefn" );
	RewireAPI.__ResetDependency__( "semver" );
} );

test( "updateVersion calls readJSONFile", t => {
	updateVersion( [ git, { release: "minor" } ] );
	t.ok( utils.readJSONFile.calledWith( "./package.json" ) );
} );

test( "updateVersion adds versions to options", t => {
	const options = { release: "minor" };
	updateVersion( [ git, options ] );
	t.ok( options.versions, { oldVersion: "1.0.0", newVersion: "1.1.0" } );
} );

test( "updateVersion passes options.release to semver.inc", t => {
	const options = { release: "minor" };
	updateVersion( [ git, options ] );
	t.ok( inc.calledWith( "1.0.0", options.release ) );
} );

test( "updateVersion calls writeJSONFile", t => {
	updateVersion( [ git, { release: "minor" } ] );
	t.ok( utils.writeJSONFile.calledWith( "./package.json", { version: "1.1.0" } ) );
} );
