import test from "ava";
import sinon from "sinon";
import nodefn from "when/node";
import { isPromise } from "../helpers/index.js";
import utils from "../../src/utils.js";

const latest = sinon.spy( ( arg, callback ) => callback( null, "1.0.0" ) );
const chalk = {
	green: sinon.stub(),
	red: sinon.stub(),
	yellow: sinon.stub()
};
const lift = sinon.spy( nodefn, "lift" );
const logger = { log: sinon.stub() };

sinon.stub( utils, "getCurrentVersion" ).returns( "1.0.0" );
utils.__Rewire__( "logger", logger );

test.beforeEach( t => {
	utils.__Rewire__( "latest", latest );
	utils.__Rewire__( "chalk", chalk );
	utils.__Rewire__( "nodefn", { lift } );
} );

test.afterEach.always( t => {
	utils.__ResetDependency__( "latest" );
	utils.__ResetDependency__( "chalk" );
	utils.__ResetDependency__( "nodefn" );
} );

test.serial( "detectVersion returns a promise", t => {
	const promise = utils.detectVersion();
	t.truthy( isPromise( promise ) );
} );

test.serial( "detectVersion calls lift", t => {
	return utils.detectVersion().then( () => {
		t.truthy( lift.called );
	} );
} );

test.serial( "detectVersion calls latest", t => {
	return utils.detectVersion().then( () => {
		t.truthy( latest.withArgs( "tag-release" ) );
	} );
} );

test.serial( "detectVersion logs latest version if they are the same", t => {
	return utils.detectVersion().then( () => {
		t.truthy( chalk.green.called );
		t.truthy( chalk.yellow.calledWith( "1.0.0" ) );
	} );
} );

test.serial( "detectVersion logs old version if they are different", t => {
	const newVersion = sinon.spy( ( arg, callback ) => callback( null, "1.1.1" ) );
	utils.__Rewire__( "latest", newVersion );
	utils.detectVersion().then( () => {
		t.truthy( chalk.red.calledWith( `You're using an old version (1.0.0) of tag-release. Please upgrade to 1.1.1.` ) );
	} );
} );
