import test from "ava";

const CHANGELOG_PATH = "./CHANGELOG.md";
const utils = {
	log: {
		begin: sinon.spy(),
		end: sinon.spy()
	},
	readFile: sinon.stub().returns( `## 1.x

### 1.0.0

* update to v1.0.0` ),
	writeFile: sinon.spy()
};
const options = {
	versions: {
		newVersion: "1.0.1"
	},
	log: "* commit message",
	release: "minor"
};
const sequenceSteps = proxyquire( "../../src/sequence-steps", {
	"./utils": utils
} );
const updateChangelog = sequenceSteps.updateChangelog;

test( "updateChangelog calls log.begin", t => {
	updateChangelog( [ helpers.git, options ] );
	t.ok( utils.log.begin.called );
} );

test( "updateChangelog should read in the CHANGELOG.md", t => {
	updateChangelog( [ helpers.git, options ] );
	t.ok( utils.readFile.calledWith( CHANGELOG_PATH ) );
} );

test( "updateChangelog should insert h3 header for minor and patch changes", t => {
	updateChangelog( [ helpers.git, options ] );
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

	updateChangelog( [ helpers.git, options ] );
	const contents = `## 2.x

### 2.0.0

* commit message

## 1.x

### 1.0.0

* update to v1.0.0`;
	t.ok( utils.writeFile.calledWith( CHANGELOG_PATH, contents ) );
} );

test( "updateChangelog calls log.end", t => {
	updateChangelog( [ helpers.git, options ] );
	t.ok( utils.log.end.called );
} );
