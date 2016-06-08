import test from "ava";
import utils from "../../src/utils";
import sinon from "sinon";

const PATH = "./data/write-test.json";
const INPUT = { x: 7, y: 8, z: 9 };
const OUTPUT = `{\n  "x": 7,\n  "y": 8,\n  "z": 9\n}\n`;

let fs = null;
let detectIndent = null;

test.beforeEach( t => {
	fs = { readFileSync: sinon.stub().returns( "" ) };
	utils.__Rewire__( "fs", fs );
	detectIndent = sinon.stub().returns( "  " );
	utils.__Rewire__( "detectIndent", detectIndent );
	sinon.stub( utils, "writeFile" );
} );

test.afterEach( t => {
	utils.__ResetDependency__( "fs" );
	utils.__ResetDependency__( "detectIndent" );
	utils.writeFile.restore();
} );

test( "writeFileJSON reads the file", t => {
	utils.writeJSONFile( PATH, INPUT );
	t.truthy( fs.readFileSync.calledWith( PATH, "utf-8" ) );
} );

test( "writeFileJSON detects the indent in the file", t => {
	utils.writeJSONFile( PATH, INPUT );
	t.truthy( detectIndent.called );
} );

test( "writeFileJSON writes the file", t => {
	utils.writeJSONFile( PATH, INPUT );
	t.truthy( utils.writeFile.calledWith( PATH, OUTPUT ) );
} );
