import test from "ava";
import sinon from "sinon";
import { git } from "../helpers/index.js";
import { updateChangelog, __RewireAPI__ as RewireAPI } from "../../src/sequence-steps";

const CHANGELOG_PATH = "./CHANGELOG.md";

const options = {
	versions: {
		newVersion: "1.0.1"
	},
	log: "* commit message",
	release: "minor"
};
let utils = null;

function getUtils( methods = {} ) {
	return Object.assign( {}, {
		log: {
			begin: sinon.spy(),
			end: sinon.spy()
		},
		readFile: sinon.stub().returns( `## 1.x

### 1.0.0

* update to v1.0.0` ),
		writeFile: sinon.spy()
	}, methods );
}

test.beforeEach( t => {
	RewireAPI.__Rewire__( "console", { log: sinon.stub() } );
	utils = getUtils();
	RewireAPI.__Rewire__( "utils", utils );
} );

test.afterEach( t => {
	RewireAPI.__ResetDependency__( "console" );
	RewireAPI.__ResetDependency__( "utils" );
} );

test( "updateChangelog calls log.begin", t => {
	updateChangelog( [ git, options ] );
	t.ok( utils.log.begin.called );
} );

test( "updateChangelog should read in the CHANGELOG.md", t => {
	updateChangelog( [ git, options ] );
	t.ok( utils.readFile.calledWith( CHANGELOG_PATH ) );
} );

test( "updateChangelog should insert h3 header for minor and patch changes", t => {
	updateChangelog( [ git, options ] );
	const contents = `## 1.x

### 1.0.1

* commit message

### 1.0.0

* update to v1.0.0`;
	t.ok( utils.writeFile.calledWith( CHANGELOG_PATH, contents ) );
} );

test( "updateChangelog should add h2 header for major changes", t => {
	options.release = "major";
	options.versions.newVersion = "2.0.0";

	updateChangelog( [ git, options ] );
	const contents = `## 2.x

### 2.0.0

* commit message

## 1.x

### 1.0.0

* update to v1.0.0`;
	t.ok( utils.writeFile.calledWith( CHANGELOG_PATH, contents ) );
} );

test( "updateChangelog should create a new CHANGELOG.md for major changes", t => {
	options.release = "major";
	options.versions.newVersion = "2.0.0";
	utils.readFile = sinon.stub().returns( "" );

	updateChangelog( [ git, options ] );
	const contents = `## 2.x

### 2.0.0

* commit message

`;
	t.ok( utils.writeFile.calledWith( CHANGELOG_PATH, contents ) );
	console.log( utils.writeFile.firstCall.args ); // eslint-disable-line
} );

test( "updateChangelog should create a new CHANGELOG.md for minor/defect changes", t => {
	options.release = "minor";
	options.versions.newVersion = "2.0.1";
	utils.readFile = sinon.stub().returns( "" );

	updateChangelog( [ git, options ] );
	const contents = `## 2.x

### 2.0.1

* commit message`;
	t.ok( utils.writeFile.calledWith( CHANGELOG_PATH, contents ) );
} );

test( "updateChangelog calls log.end", t => {
	updateChangelog( [ git, options ] );
	t.ok( utils.log.end.called );
} );
