import test from "ava";
import sinon from "sinon";
import "sinon-as-promised";
import utils from "../../src/utils.js";

const logger = { log: sinon.stub() };
const cowsay = { say: sinon.stub() };
const processExit = process.exit;

test.beforeEach( t => {
	process.exit = sinon.stub();
	utils.__Rewire__( "logger", logger );
	utils.__Rewire__( "cowsay", cowsay );
	utils.__Rewire__( "processExit", processExit );
} );

test.afterEach( t => {
	process.exit = processExit;
	utils.__ResetDependency__( "logger" );
	utils.__ResetDependency__( "cowsay" );
	utils.__ResetDependency__( "processExit" );
} );

test.serial( "advise calls cowsay.say", t => {
	utils.advise( "hello world", { exit: false } );
	t.truthy( cowsay.say.called );
} );

test.serial( "advise calls logger.log", t => {
	utils.advise( "hello world", { exit: false } );
	t.truthy( logger.log.called );
} );

test.serial( "advise calls processExit when passed exit flag", t => {
	utils.advise( "hello world", { exit: true } );
	t.truthy( process.exit.called );
} );
