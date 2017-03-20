import test from "ava";
import sinon from "sinon";
import { git } from "../helpers/index.js";
import { previewLog, __RewireAPI__ as RewireAPI } from "../../src/sequence-steps";

const logger = {};

test.beforeEach( t => {
	logger.log = sinon.spy();
	RewireAPI.__Rewire__( "logger", logger );
} );

test.afterEach( t => {
	RewireAPI.__ResetDependency__( "logger" );
} );

test.serial( "shows logs if provided", t => {
	const options = {
		log: `* I am some random commit`
	};
	previewLog( [ git, options ] );
	t.truthy( logger.log.calledWith( "\u001b[1mHere is a preview of your log:\u001b[22m\n\u001b[32m* I am some random commit\u001b[39m" ) );
} );

test.serial( "show blank line if no logs provided", t => {
	const options = {
		log: ""
	};
	previewLog( [ git, options ] );
	t.truthy( logger.log.calledWith( "\u001b[1mHere is a preview of your log:\u001b[22m\n" ) );
} );
