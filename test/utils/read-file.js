import test from "ava";
import utils from "../../src/utils";
import sinon from "sinon";

const PATH = "./data/read-test.md";

let fs = null;

test.beforeEach( t => {
	fs = { readFileSync: sinon.stub().returns( "" ) };
	utils.__Rewire__( "fs", fs );
} );

test.afterEach( t => {
	utils.__ResetDependency__( "fs" );
} );

test( "readFile should read file contents", t => {
	utils.readFile( PATH );
	t.ok( fs.readFileSync.calledWith( PATH, "utf-8" ) );
} );

test( "readFile should return empty string if file doesn't exist", t => {
	fs = { readFileSync: sinon.stub().throws( "Error" ) };
	utils.__Rewire__( "fs", fs );
	t.is( utils.readFile( PATH ), "" );
} );
