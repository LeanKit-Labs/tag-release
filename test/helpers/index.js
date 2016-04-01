const isObject = require( "lodash" ).isObject;

module.exports = {
	isPromise: function( promise ) {
		return isObject( promise ) &&
			promise.then instanceof Function &&
			promise.catch instanceof Function;
	},
	git: {
		checkout: sinon.spy( ( arg, callback ) => callback( null, "success" ) ),
		merge: sinon.spy( ( arg, callback ) => callback( null, "success" ) ),
		add: sinon.spy( ( arg, callback ) => callback( null, "success" ) ),
		commit: sinon.spy( ( arg, callback ) => callback( null, "success" ) ),
		addAnnotatedTag: sinon.spy( ( arg1, arg2, callback ) => callback( null, "success" ) ),
		push: sinon.spy( ( arg1, arg2, callback ) => callback( null, "success" ) )
	}
};
