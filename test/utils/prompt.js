import test from "ava";
import utils from "../../src/utils";
import sinon from "sinon";
import { isPromise } from "../helpers/index.js";

const questions = [ { type: "confirm", message: "proceed", name: "proceed" } ];

let inquirer = null;

test.beforeEach( t => {
	inquirer = {
		prompt: sinon.spy( ( arg, callback ) => callback( "answers" ) )
	};
	utils.__Rewire__( "inquirer", inquirer );
} );

test.afterEach( t => {
	utils.__ResetDependency__( "inquirer" );
} );

test( "prompt returns a promise", t => {
	const promise = utils.prompt( questions );
	t.truthy( isPromise( promise ) );
} );

test( "prompt calls inquirer.prompt", t => {
	utils.prompt( questions );
	t.truthy( inquirer.prompt.calledWith( questions ) );
} );

test( "prompt resolves if inquirer.prompt succeeds", t => {
	return utils.prompt( questions ).then( data => {
		t.is( data, "answers" );
	} );
} );
