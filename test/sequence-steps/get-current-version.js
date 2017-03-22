import test from "ava";
import sinon from "sinon";
import { git } from "../helpers/index.js";

const utils = {
	readJSONFile: sinon.stub().returns( {
		version: "1.0.0"
	} ),
	advise: sinon.spy()
};

import { getCurrentVersion, __RewireAPI__ as RewireAPI } from "../../src/sequence-steps";

test.beforeEach( t => {
	RewireAPI.__Rewire__( "utils", utils );
} );

test.afterEach( t => {
	RewireAPI.__ResetDependency__( "utils" );
} );

test.serial( "getCurrentVersion calls readJSONFile", t => {
	getCurrentVersion( [ git, {} ] );
	t.truthy( utils.readJSONFile.calledWith( "./package.json" ) );
} );

test.serial( "getCurrentVersion should add currentVersion to options", t => {
	const options = {};
	getCurrentVersion( [ git, options ] );
	t.truthy( options.currentVersion, "1.0.0" );
} );

test.serial( "getCurrentVersion gives advise when utils.readJSONFile fails", t => {
	utils.readJSONFile = sinon.stub().throws();
	getCurrentVersion( [ git, {} ] );
	t.truthy( utils.advise.called );
} );
