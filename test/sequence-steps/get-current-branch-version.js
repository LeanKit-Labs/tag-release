import test from "ava";
import sinon from "sinon";
import { git } from "../helpers/index.js";

const utils = {
	readJSONFile: sinon.stub().returns( {
		version: "1.0.0"
	} ),
	advise: sinon.spy()
};

import { getCurrentBranchVersion, __RewireAPI__ as RewireAPI } from "../../src/sequence-steps";

test.beforeEach( t => {
	RewireAPI.__Rewire__( "utils", utils );
} );

test.afterEach( t => {
	RewireAPI.__ResetDependency__( "utils" );
} );

test.serial( "getCurrentBranchVersion calls readJSONFile", t => {
	getCurrentBranchVersion( [ git, { configPath: "./package.json" } ] );
	t.truthy( utils.readJSONFile.calledWith( "./package.json" ) );
} );

test.serial( "getCurrentBranchVersion should add currentVersion to options", t => {
	const options = {};
	getCurrentBranchVersion( [ git, options ] );
	t.truthy( options.currentVersion, "1.0.0" );
} );

test.serial( "getCurrentBranchVersion gives advise when utils.readJSONFile fails", t => {
	utils.readJSONFile = sinon.stub().throws();
	getCurrentBranchVersion( [ git, {} ] );
	t.truthy( utils.advise.called );
} );
