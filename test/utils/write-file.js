import test from "ava";

const fs = {
	writeFileSync: sinon.stub()
};
const utils = proxyquire( "../../src/utils", {
	"fs": fs
} );
const WRITE_TEXT_PATH = "./data/write-test.md";

test( "writeFile should write file contents", t => {
	const content = "content";
	utils.writeFile( WRITE_TEXT_PATH, content );
	t.ok( fs.writeFileSync.calledWith( WRITE_TEXT_PATH, content, "utf-8" ) );
} );
