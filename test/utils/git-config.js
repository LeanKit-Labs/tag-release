import test from "ava";
import utils from "../../src/utils";
import sinon from "sinon";

utils.exec = sinon.spy( command => Promise.resolve( "resolved" ) );

test( "getGitConfig calls exec with get parameters", t => {
	utils.getGitConfig( "name" );
	t.truthy( utils.exec.calledWithExactly( "git config --global name" ) );
} );

test( "setGitConfig calls exec with set parameters", t => {
	utils.setGitConfig( "name", "value" );
	t.truthy( utils.exec.calledWithExactly( "git config --global name value" ) );
} );
