
const fs = require( "fs" );
const childProcess = require( "child_process" );
const inquirer = require( "inquirer" );
const editor = require( "editor" );
const logUpdate = require( "log-update" );
const detectIndent = require( "detect-indent" );

module.exports = {
	readFile( path ) {
		try {
			return fs.readFileSync( path, "utf-8" );
		} catch ( exception ) {
			return "";
		}
	},
	readJSONFile( path ) {
		const content = this.readFile( path );
		return JSON.parse( content );
	},
	writeFile( path, content ) {
		return fs.writeFileSync( path, content, "utf-8" );
	},
	writeJSONFile( path, content ) {
		const file = fs.readFileSync( path, "utf-8" );
		const indent = detectIndent( file ).indent || "  ";
		content = `${ JSON.stringify( content, null, indent ) }\n`;
		return this.writeFile( path, content );
	},
	exec( command ) {
		return new Promise( ( resolve, reject ) =>
			childProcess.exec( command, ( error, stdout, stderr ) => {
				if ( error === null ) {
					resolve( stdout );
				} else {
					reject( stderr );
				}
			} )
		);
	},
	prompt( questions ) {
		return new Promise( ( resolve, reject ) =>
			inquirer.prompt( questions, answers => {
				resolve( answers );
			} )
		);
	},
	editor( data ) {
		const tempFilePath = "./.shortlog";

		return new Promise( ( resolve, reject ) => {
			this.writeFile( tempFilePath, data );
			editor( tempFilePath, ( code, sig ) => {
				if ( code === 0 ) {
					const contents = this.readFile( tempFilePath );
					fs.unlinkSync( tempFilePath );
					resolve( contents );
				} else {
					reject( `Unable to edit ${ tempFilePath }` );
				}
			} );
		} );
	},
	log: {
		lastLog: "",
		begin( text ) {
			logUpdate( `${ text } ☐` );
			this.lastLog = text;
		},
		end() {
			logUpdate( `${ this.lastLog } ☑` );
			logUpdate.done();
		}
	}
};
