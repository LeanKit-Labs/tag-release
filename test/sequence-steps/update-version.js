import test from "ava";

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
const semver = {
	inc: sinon.stub().returns( "1.1.0" )
};
const sequenceSteps = proxyquire( "../../src/sequence-steps", {
	"./utils": utils,
	"semver": semver
} );
const updateVersion = sequenceSteps.updateVersion;

test( "updateVersion calls readJSONFile", t => {
	updateVersion( [ helpers.git, { release: "minor" } ] );
	t.ok( utils.readJSONFile.calledWith( "./package.json" ) );
} );

test( "updateVersion adds versions to options", t => {
	const options = { release: "minor" };
	updateVersion( [ helpers.git, options ] );
	t.ok( options.versions, { oldVersion: "1.0.0", newVersion: "1.1.0" } );
} );

test( "updateVersion passes options.release to semver.inc", t => {
	const options = { release: "minor" };
	updateVersion( [ helpers.git, options ] );
	t.ok( semver.inc.calledWith( "1.0.0", options.release ) );
} );

test( "updateVersion calls writeJSONFile", t => {
	updateVersion( [ helpers.git, { release: "minor" } ] );
	t.ok( utils.writeJSONFile.calledWith( "./package.json", { version: "1.1.0" } ) );
} );
