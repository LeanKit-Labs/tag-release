import test from "ava";

const fs = {
	readFileSync: sinon.stub().returns( "" )
};
const detectIndent = sinon.stub().returns( "  " );
const utils = proxyquire( "../../src/utils", {
	"fs": fs,
	"detect-indent": detectIndent
} );
const PATH = "./data/write-test.json";
const INPUT = { x: 7, y: 8, z: 9 };
const OUTPUT = `{\n  "x": 7,\n  "y": 8,\n  "z": 9\n}\n`;

sinon.stub( utils, "writeFile" );

test( "writeFileJSON reads the file", t => {
	utils.writeJSONFile( PATH, INPUT );
	t.ok( fs.readFileSync.calledWith( PATH, "utf-8" ) );
} );

test( "writeFileJSON detects the indent in the file", t => {
	utils.writeJSONFile( PATH, INPUT );
	t.ok( detectIndent.called );
} );

test( "writeFileJSON writes the file", t => {
	utils.writeJSONFile( PATH, INPUT );
	t.ok( utils.writeFile.calledWith( PATH, OUTPUT ) );
} );
