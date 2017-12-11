const fs = require( 'fs' );
const http = require( 'http' );
const motor = require( './application/motor.sjs' );

const https = require( 'https' );
const https_options = {
	key: fs.readFileSync( './https/key.pem' ),
	cert: fs.readFileSync( './https/cert.pem' )
};

function log_success( req, res ){
	let dt = Date.now(),
		start = req.custom.start,
		code = req.custom.code;
	console.log( `code=${code} length=${dt - start}ms request=${JSON.stringify( req.file.substr( 0, 40 ) )}` );
}

function log_failure( req, res, err ) {
	let dt = Date.now(),
		start = req.custom.start;
	console.log( `failure length=${dt - start}ms request=${JSON.stringify( req.file.substr( 0, 40 ) )}` );
	res.end( '' + err );
}

const server = https.createServer( https_options, ( req, res ) => {

	req.custom = { 'start': Date.now() };

	if( req instanceof http.IncomingMessage && res instanceof http.ServerResponse )
		motor.clone().settings( req, res ).send( log_success, log_failure );
	else
		throw new Error( "Bad connection objects!" );
} );

const hostname = '127.0.0.1';
const port = 443;
server.listen( port, hostname, () => {
	console.log( `Server running at https://${hostname}:${port}/` );
} );
