import test from "ava";
import utils from "../../src/utils";
import sinon from "sinon";

const PATH = "./data/write-test.json";
const INPUT = `{\n  "x": 7,\n  "y": 8,\n  "z": 9\n}\n`;
const OUTPUT = { x: 7, y: 8, z: 9 };

test.beforeEach( t => {
	sinon.stub( utils, "readFile" ).returns( INPUT );
} );

test.afterEach( t => {
	utils.readFile.restore();
} );

test( "readJSONFile should read a file", t => {
	utils.readJSONFile( PATH );
	t.ok( utils.readFile.calledWith( PATH ) );
} );

test( "readJSONFile parses the file", t => {
	t.same( utils.readJSONFile( PATH ), OUTPUT );
} );
