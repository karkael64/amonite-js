const HttpCode = require( './libraries/http-code.class.sjs' );
HttpCode.DEBUG_MODE = false;

const fs = require( 'fs' );
const motor = require( './application/motor.sjs' );

const http = require( 'http' );

const server = http.createServer( ( req, res ) => {
	res.start = Date.now();
	return motor.execute( req, res, motor.log );
});

const hostname = '127.0.0.1';
const port = 8000;
server.listen( port, hostname, () => {
	return console.log( `Server running at http://${hostname}:${port}/` );
});
