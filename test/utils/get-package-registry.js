// configs
// scoped name
//// publishConfig.registry defined, use that
//// undefined; global registry, get via "npm get <@lk>:registry"
// not scoped name
//// publishConfig.registry defined, use that
//// undefined; get via `npm get registry`

console.log('++++++++++++', new Date(), '+++++++++++++')
import test from "ava";
import sinon from "sinon";
import utils from "../../src/utils";
import { isPromise } from "../helpers/index.js";

let get = null;

const createReadJSONMock = config => {
	sinon.stub( utils, "readJSONFile" ).returns( { name: config.pkgName } );
	sinon.stub( utils, "exec" );

	if ( config.pubLocation ) {
		get = sinon.stub().returns( config.pubLocation );
		utils.__Rewire__( "get", get );
	}
};

test.beforeEach( t => {

} );

test.afterEach( t => {
	utils.readJSONFile.restore();
	utils.__ResetDependency__( "get" );
} );


// not passing

test( "getPackageRegistry reads from local package.json", t => {
	const config = {
		pkgName: "@aja/my-special-project"
	};
	createReadJSONMock( config );

	return utils.getPackageRegistry().then( () => {
		t.ok( utils.readJSONFile.called );
	} );
} );

// not passing

test( "getPackageRegistry when registry not supplied in package.json reads from npm config for registry", t => {
	const config = {
		pkgName: "@aja/my-special-project"
	};
	createReadJSONMock( config );

	return utils.getPackageRegistry().then( () => {
		t.ok( utils.exec.calledWith( "npm get @aja:registry" ) );
	} );
} );

// passing

test( "getPackageRegistry successfully gets registry from package.json", t => {
	const config = {
		pkgName: "@aja/my-special-project",
		pubLocation: "http://www.google.com/special-project"
	};
	createReadJSONMock( config );

	return utils.getPackageRegistry().then( () => {
		t.ok( get.calledWith( {
			name: "@aja/my-special-project"
		}, "publishConfig.registry" ) );
	} );
} );

// passing only when run on its own

test( "getPackageRegistry when registry supplied in package.json returns registry name", t => {
	const config = {
		pkgName: "@aja/my-special-project",
		pubLocation: "http://www.google.com/special-project"
	};
	createReadJSONMock( config );

	return utils.getPackageRegistry().then( registry => {
		t.ok( true );
		t.is( registry, "http://www.google.com/special-project" );
	} );
} );
