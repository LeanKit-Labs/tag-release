global.sinon = require( "sinon" );
global.proxyquire = require( "proxyquire" ).noPreserveCache();
global.helpers = require( "./index.js" );
global.nodefn = require( "when/node" );

sinon.stub( console, "log" );
