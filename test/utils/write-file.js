import test from "ava";
import utils from "../../src/utils";
import sinon from "sinon";

const WRITE_TEXT_PATH = "./data/write-test.md";

let fs = null;

test.beforeEach( t => {
	fs = { writeFileSync: sinon.stub() };
	utils.__Rewire__( "fs", fs );
} );

test.afterEach( t => {
	utils.__ResetDependency__( "fs" );
} );

test( "writeFile should write file contents", t => {
	const content = "content";
	utils.writeFile( WRITE_TEXT_PATH, content );
	t.truthy( fs.writeFileSync.calledWith( WRITE_TEXT_PATH, content, "utf-8" ) );
} );
