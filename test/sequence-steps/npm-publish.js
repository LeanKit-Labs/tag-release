import test from "ava";
import sinon from "sinon";
import nodefn from "when/node";
import { git } from "../helpers/index.js";

const utils = {
	log: {
		begin: sinon.spy(),
		end: sinon.spy()
	},
	prompt: sinon.spy( command => new Promise( resolve => resolve( { publish: true } ) ) ),
	exec: sinon.spy( command => new Promise( resolve => resolve( "data" ) ) )
};
const lift = sinon.spy( nodefn, "lift" );

import { npmPublish, __RewireAPI__ as RewireAPI } from "../../src/sequence-steps";

test.beforeEach( t => {
	RewireAPI.__Rewire__( "utils", utils );
	RewireAPI.__Rewire__( "nodefn", { lift } );
} );

test.afterEach( t => {
	RewireAPI.__ResetDependency__( "utils" );
	RewireAPI.__ResetDependency__( "nodefn" );
} );

test( "npmPublish calls log.begin", t => {
	return npmPublish( [ git, {} ], () => {
		t.ok( utils.log.begin.called );
	} );
} );

test( "npmPublish publishes if confirms prompt", t => {
	const COMMAND = "npm publish";
	return npmPublish( [ git, {} ], () => {
		t.ok( utils.exec.calledWith( COMMAND ) );
	} );
} );

test( "npmPublish doesn't publish if denies prompt", t => {
	utils.prompt = sinon.spy( command => new Promise( resolve => resolve( { publish: false } ) ) );
	return npmPublish( [ git, {} ], () => {
		t.ok( !utils.exec.called );
	} );
} );

test( "npmPublish calls log.end", t => {
	return npmPublish( [ git, {} ] ).then( () => {
		t.ok( utils.log.end.called );
	} );
} );
