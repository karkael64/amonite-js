const HttpCode = require( './libraries/http-code.class.sjs' );
HttpCode.DEBUG_MODE = false;

const fs = require( 'fs' );
const motor = require( './application/motor.sjs' );

const https = require( 'https' );
const https_options = {
	key: fs.readFileSync( './https/key.pem' ),
	cert: fs.readFileSync( './https/cert.pem' )
};

const server = https.createServer( https_options, ( req, res ) => {
	res.start = Date.now();
	return motor.execute( req, res, motor.log );
});

const hostname = '127.0.0.1';
const port = 443;
server.listen( port, hostname, () => {
	return console.log( `Server running at https://${hostname}:${port}/` );
});
