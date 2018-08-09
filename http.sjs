const HttpCode = require( 'http-code' );
HttpCode.DEBUG_MODE = true;

const motor = require( './application/motor.sjs' );
const http = require( 'http' );

const server = http.createServer( ( req, res ) => {
	return motor.execute( req, res, motor.log );
});

const hostname = '127.0.0.1';
const port = 8000;
server.listen( port, hostname, () => {
	return console.log( `Server running at http://${hostname}:${port}/` );
});
