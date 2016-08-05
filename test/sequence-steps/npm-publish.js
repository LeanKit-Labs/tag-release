import test from "ava";
import sinon from "sinon";
import nodefn from "when/node";
import { git } from "../helpers/index.js";

let utils = {};
import realUtils from "../../src/utils.js";
import { npmPublish, __RewireAPI__ as RewireAPI } from "../../src/sequence-steps";
const lift = sinon.spy( nodefn, "lift" );
const getUtils = ( { isPrivate = false } = {} ) => {
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
		getPackageRegistry: realUtils.getPackageRegistry,
		isPackagePrivate: sinon.stub().returns( isPrivate )
	};
};

test.beforeEach( t => {
	utils = getUtils();
	RewireAPI.__Rewire__( "utils", utils );
	RewireAPI.__Rewire__( "nodefn", { lift } );
} );

test.serial( "npmPublish calls log.begin", t => {
	return npmPublish( [ git, {} ], () => {
		t.truthy( utils.log.begin.called );
	} );
} );

test.serial( "npmPublish publishes if confirms prompt", t => {
	const COMMAND = "npm publish";
	return npmPublish( [ git, {} ], () => {
		t.truthy( utils.exec.calledWith( COMMAND ) );
	} );
} );

test.serial( "npmPublish calls log.end", t => {
	return npmPublish( [ git, {} ] ).then( () => {
		t.truthy( utils.log.end.called );
	} );
} );

test.serial( "npmPublish doesn't publish if denies prompt", t => {
	utils.prompt = sinon.spy( command => new Promise( resolve => resolve( { publish: false } ) ) );
	return npmPublish( [ git, {} ], () => {
		t.truthy( !utils.exec.called );
	} );
} );

test.serial( "npmPublish doesn't prompt if package is private", t => {
	utils = getUtils( { isPrivate: true } );
	RewireAPI.__Rewire__( "utils", utils );
	return npmPublish( [ git, {} ], () => {
		t.truthy( !utils.getPackageRegistry.called );
	} );
} );

test.serial( "npmPublish gives advise when utils.exec fails", t => {
	const myUtils = {
		log: {
			begin: sinon.spy(),
			end: sinon.spy()
		},
		prompt: sinon.spy( command => new Promise( resolve => resolve( { publish: true } ) ) ),
		exec: sinon.spy( command => Promise.reject() ),
		readJSONFile: sinon.stub().returns( {
			name: "test-project",
			publishConfig: { registry: "http://my-registry.com" }
		} ),
		isPackagePrivate: sinon.stub().returns( false ),
		getPackageRegistry: realUtils.getPackageRegistry,
		advise: sinon.spy()
	};
	RewireAPI.__Rewire__( "utils", myUtils );
	return npmPublish( [ git, {} ] ).catch( () => {
		t.truthy( utils.advise.called );
	} );
} );
