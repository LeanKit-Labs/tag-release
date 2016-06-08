import test from "ava";
import sinon from "sinon";
import nodefn from "when/node";
import { git } from "../helpers/index.js";

let utils = {};
import realUtils from "../../src/utils.js";
import { npmPublish, __RewireAPI__ as RewireAPI } from "../../src/sequence-steps";
const lift = sinon.spy( nodefn, "lift" );
const getUtils = () => {
	return {
		log: {
			begin: sinon.spy(),
			end: sinon.spy()
		},
		prompt: sinon.spy( command => new Promise( resolve => resolve( { publish: true } ) ) ),
		exec: sinon.spy( command => new Promise( resolve => resolve( "data" ) ) ),
		readJSONFile: sinon.stub().returns( {
			name: "test-project",
			publishConfig: { registry: "http://my-registry.com" }
		} ),
		getPackageRegistry: realUtils.getPackageRegistry
	};
};

test.beforeEach( t => {
	utils = getUtils();
	RewireAPI.__Rewire__( "utils", utils );
	RewireAPI.__Rewire__( "nodefn", { lift } );
} );

test( "npmPublish calls log.begin", t => {
	return npmPublish( [ git, {} ], () => {
		t.truthy( utils.log.begin.called );
	} );
} );

test( "npmPublish publishes if confirms prompt", t => {
	const COMMAND = "npm publish";
	return npmPublish( [ git, {} ], () => {
		t.truthy( utils.exec.calledWith( COMMAND ) );
	} );
} );

test( "npmPublish doesn't publish if denies prompt", t => {
	utils.prompt = sinon.spy( command => new Promise( resolve => resolve( { publish: false } ) ) );
	return npmPublish( [ git, {} ], () => {
		t.truthy( !utils.exec.called );
	} );
} );

test( "npmPublish calls log.end", t => {
	return npmPublish( [ git, {} ] ).then( () => {
		t.truthy( utils.log.end.called );
	} );
} );
