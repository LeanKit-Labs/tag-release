import test from "ava";
import sinon from "sinon";
import nodefn from "when/node";
import { git, isPromise } from "../helpers/index.js";

const latest = sinon.spy( ( arg, callback ) => callback( null, "1.0.0" ) );
const chalk = {
	green: sinon.stub(),
	red: sinon.stub()
};
const lift = sinon.spy( nodefn, "lift" );
const utils = {
	getCurrentVersion: sinon.stub().returns( "1.0.0" )
};
const logger = { log: sinon.stub() };

import { detectVersion, __RewireAPI__ as RewireAPI } from "../../src/sequence-steps";

RewireAPI.__Rewire__( "logger", logger );

test.beforeEach( t => {
	RewireAPI.__Rewire__( "utils", utils );
	RewireAPI.__Rewire__( "latest", latest );
	RewireAPI.__Rewire__( "chalk", chalk );
	RewireAPI.__Rewire__( "nodefn", { lift } );
} );

test.afterEach.always( t => {
	RewireAPI.__ResetDependency__( "utils" );
	RewireAPI.__ResetDependency__( "latest" );
	RewireAPI.__ResetDependency__( "chalk" );
	RewireAPI.__ResetDependency__( "nodefn" );
} );

test.serial( "detectVersion returns a promise", t => {
	const promise = detectVersion( [ git, {} ] );
	t.truthy( isPromise( promise ) );
} );

test.serial( "detectVersion calls lift", t => {
	return detectVersion( [ git, {} ] ).then( () => {
		t.truthy( lift.called );
	} );
} );

test.serial( "detectVersion calls latest", t => {
	return detectVersion( [ git, {} ] ).then( () => {
		t.truthy( latest.withArgs( "tag-release" ) );
	} );
} );

test.serial( "detectVersion logs latest version if they are the same", t => {
	return detectVersion( [ git, {} ] ).then( () => {
		t.truthy( chalk.green.calledWith( `You're using the latest version (1.0.0) of tag-release.` ) );
	} );
} );

test.serial( "detectVersion logs old version if they are different", t => {
	const newVersion = sinon.spy( ( arg, callback ) => callback( null, "1.1.1" ) );
	RewireAPI.__Rewire__( "latest", newVersion );
	detectVersion( [ git, {} ] ).then( () => {
		t.truthy( chalk.red.calledWith( `You're using an old version (1.0.0) of tag-release. Please upgrade to 1.1.1.` ) );
	} );
} );
