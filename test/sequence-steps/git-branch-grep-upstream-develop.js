import test from "ava";
import sinon from "sinon";
import { git } from "../helpers/index.js";

const utils = {
	exec: sinon.spy( command => new Promise( resolve => resolve() ) )
};

import { gitBranchGrepUpstreamDevelop, __RewireAPI__ as RewireAPI } from "../../src/sequence-steps";

test.beforeEach( t => {
	utils.exec.reset();
	RewireAPI.__Rewire__( "utils", utils );
} );

test.afterEach( t => {
	RewireAPI.__ResetDependency__( "utils" );
} );

test.cb( "gitBranchGrepUpstreamDevelop calls git branch command", t => {
	gitBranchGrepUpstreamDevelop( [ git, {} ] ).then( () => {
		t.truthy( utils.exec.calledWith( `git branch -r | grep "upstream/develop"` ) );
		t.end();
	} );
} );

test.cb( "gitBranchGrepUpstreamDevelop sets options.develop=true when upstream/develop exists", t => {
	const options = { develop: false };
	gitBranchGrepUpstreamDevelop( [ git, options ] ).then( () => {
		t.truthy( options.develop );
		t.end();
	} );
} );

test.cb( "gitBranchGrepUpstreamDevelop sets options.develop=false when upstream/develop does not exist", t => {
	const options = { develop: true };
	utils.exec = sinon.spy( command => new Promise( ( resolve, reject ) => reject() ) );
	gitBranchGrepUpstreamDevelop( [ git, options ] ).then( () => {
		t.truthy( !options.develop );
		t.end();
	} );
} );

