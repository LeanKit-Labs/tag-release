import test from "ava";

const fs = {
	readFileSync: sinon.stub().returns( "" )
};
const utils = proxyquire( "../../src/utils", {
	"fs": fs
} );
const PATH = "./data/read-test.md";

test( "readFile should read file contents", t => {
	utils.readFile( PATH );
	t.ok( fs.readFileSync.calledWith( PATH, "utf-8" ) );
} );

test( "readFile should return empty string if file doesn't exist", t => {
	const fs = { readFileSync: sinon.stub().throws( "Error" ) };
	t.is( utils.readFile( PATH ), "" );
} );
