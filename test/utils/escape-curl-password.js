import test from "ava";
import utils from "../../src/utils";

test( "escapeCurlPassword doesn't change a normal password", t => {
	t.is( utils.escapeCurlPassword( "normal" ), "normal" );
} );

test( "escapeCurlPassword escapes a password with special characters", t => {
	t.is( utils.escapeCurlPassword( "we$rd" ), "we\\$rd" );
} );
