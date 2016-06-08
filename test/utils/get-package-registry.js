import test from "ava";
import sinon from "sinon";
import utils from "../../src/utils";

let get = null;

const createReadJSONMock = config => {
	if ( !utils.readJSONFile.isSinonProxy ) {
		sinon.stub( utils, "readJSONFile" ).returns( { name: config.pkgName } );
	}

	if ( !utils.exec.isSinonProxy ) {
		sinon.stub( utils, "exec" ).returns( new Promise( resolve => resolve() ) );
	}

	if ( config.pubLocation ) {
		get = sinon.stub().returns( config.pubLocation );
		utils.__Rewire__( "get", get );
	}
};

test.afterEach( t => {
	if ( utils.readJSONFile.isSinonProxy ) {
		utils.readJSONFile.restore();
	}
	utils.__ResetDependency__( "get" );
} );

test.serial( "getPackageRegistry reads from local package.json", t => {
	const config = {
		pkgName: "@aja/my-special-project",
		pubLocation: "http://www.google.com/my-special-project"
	};
	createReadJSONMock( config );

	return utils.getPackageRegistry().then( () => {
		t.truthy( get.calledWith( {
			name: "@aja/my-special-project"
		}, "publishConfig.registry" ) );
	} );
} );

test.serial( "getPackageRegistry when registry not supplied in package.json reads from npm config for scoped namespace", t => {
	const config = {
		pkgName: "@aja/my-special-project"
	};
	createReadJSONMock( config );

	return utils.getPackageRegistry().then( () => {
		t.truthy( utils.exec.calledWith( "npm get @aja:registry" ) );
	} );
} );

test.serial( "getPackageRegistry successfully gets registry from package.json", t => {
	const config = {
		pkgName: "my-special-project",
		pubLocation: "http://www.google.com/special-project"
	};
	createReadJSONMock( config );

	return utils.getPackageRegistry().then( () => {
		t.truthy( get.calledWith( {
			name: "my-special-project"
		}, "publishConfig.registry" ) );
	} );
} );

test.serial( "getPackageRegistry when registry not supplied in package.json reads from npm config", t => {
	const config = {
		pkgName: "my-special-project"
	};
	createReadJSONMock( config );

	return utils.getPackageRegistry().then( () => {
		t.truthy( utils.exec.calledWith( "npm get registry" ) );
	} );
} );
