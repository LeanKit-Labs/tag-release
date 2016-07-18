import test from "ava";
import utils from "../../src/utils";

test.beforeEach( t => {
	utils.__Rewire__( "currentPackage", { version: "1.1.1" } );
} );

test.serial( "getCurrentVersion returns the package.json version", t => {
	t.is( utils.getCurrentVersion(), "1.1.1" );
} );
