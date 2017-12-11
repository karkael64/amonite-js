const path = require( 'path' );
const fs = require( 'fs' );
const http = require( 'http' );
const type = require( '../libraries/types.sjs' );
const HttpCode = require( '../libraries/http-code.class.sjs' );


//  constants
function getFilename( req ) {

	let filename = req.file.replace( /\.\./, '' ).replace( /\/\//, '/' );
	filename = path.normalize( filename );
	return path.normalize( './theme/' + filename );
}

function getExecname( req ) {

	let filename = req.file.replace( /\.\./, '' ).replace( /\/\//, '/' );
	return '../theme/' + filename;
}

function isExecuteFilename( req ) {
	let filename = getFilename( req );
	return !!filename.match( /\.sjs$/ );
}


//  validators
function isSimpleFile( req, fn ) {
	if( req instanceof http.IncomingMessage && type.is_function( fn ) ){
		if( !isExecuteFilename( req ) ) {
			fs.access( getFilename( req ), ( err )=>{
				fn( !err );
			})
		}
		else
			fn( false );
	}
	else
		throw new Error( "Bad arguments" );
}

function isExecuteFile( req, fn ) {
	if( req instanceof http.IncomingMessage && type.is_function( fn ) ){
		if( isExecuteFilename( req ) ) {
			fs.access( getFilename( req ), ( err )=>{
				fn( !err );
			});
		}
		else
			fn( false );
	}
	else
		throw new Error( "Bad arguments" );
}

function isHiddenFile( req, fn ) {
	if( req instanceof http.IncomingMessage && type.is_function( fn ) ){
		if( !isExecuteFilename( req ) ){
			fs.access( getFilename( req ) + ".sjs", ( err ) => {
				fn( !err );
			});
		}
		else
			fn( false );
	}
	else
		throw new Error( "Bad arguments" );
}


//  execution
function readSimpleFile( req, res, success, failure ) {
	if( req instanceof http.IncomingMessage && type.is_function( success ) ){
		fs.readFile( getFilename( req ), ( err, data ) =>{
			success( err || data );
		});
	}
	else
		failure( new Error( "Bad arguments" ) );
}

function readExecuteFile( req, res, success, failure ) {
	if( req instanceof http.IncomingMessage && type.is_function( success ) ){
		try {
			success( require( getExecname( req ) ) );
		}
		catch( err ) {
			failure( err );
		}
	}
	else
		failure( new Error( "Bad arguments" ) );
}

function readHiddenFile( req, res, success, failure ) {
	if( req instanceof http.IncomingMessage && type.is_function( success ) ){
		try {
			success( require( getExecname( req ) + '.sjs' ) );
		}
		catch( err ) {
			failure( err );
		}
	}
	else
		failure( new Error( "Bad arguments" ) );
}


//  controllers
function controller_simpleFile( req, res, next ) {
	isSimpleFile( req, ( bool )=>{
		if( bool )
			next( null, readSimpleFile );
		else
			next( new Error( "No match file." ) );
	})
}

function controller_execFile( req, res, next ) {
	isExecuteFile( req, ( bool )=>{
		if( bool )
			next( null, readExecuteFile );
		else
			next( new Error( "No match file." ) );
	});
}

function controller_hiddenFile( req, res, next ) {
	isHiddenFile( req, ( bool )=>{
		if( bool )
			next( null, readHiddenFile );
		else
			next( new Error( "No match file." ) );
	})
}


//  sum
function getData( req, next ) {

	isSimpleFile( req, ( bool )=>{
		if( bool ) {
			readSimpleFile( req, ( data )=>{
				next( data );
			});
		}
		else {
			isExecuteFile( req, ( bool )=>{
				if( bool ) {
					readExecuteFile( req, ( data )=>{
						next( data );
					});
				}
				else {
					isHiddenFile( req, ( bool )=>{
						if( bool ) {
							readHiddenFile( req, ( data )=>{
								next( data );
							});
						}
						else {
							next( new HttpCode( 404 ) );
						}
					});
				}
			});
		}
	})
}


module.exports = {
	'simpleFile': controller_simpleFile,
	'execFile': controller_execFile,
	'hiddenFile' : controller_hiddenFile
};