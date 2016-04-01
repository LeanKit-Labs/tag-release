import test from "ava";

const inquirer = {
	prompt: sinon.spy( ( arg, callback ) => callback( "answers" ) )
};
const utils = proxyquire( "../../src/utils", {
	"inquirer": inquirer
} );
const questions = [ { type: "confirm", message: "proceed", name: "proceed" } ];

test( "prompt returns a promise", t => {
	const promise = utils.prompt( questions );
	t.ok( helpers.isPromise( promise ) );
} );

test( "prompt calls inquirer.prompt", t => {
	utils.prompt( questions );
	t.ok( inquirer.prompt.calledWith( questions ) );
} );

test( "prompt resolves if inquirer.prompt succeeds", t => {
	return utils.prompt( questions ).then( data => {
		t.is( data, "answers" );
	} );
} );
