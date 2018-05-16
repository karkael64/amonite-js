const HttpCode = require( './libraries/http-code.class.sjs' );
HttpCode.DEBUG_MODE = false;

const fs = require( 'fs' );
const logFile = require( './libraries/file.class.sjs' ).build( './motor.log' );
const motor = require( './application/motor.sjs' );

const https = require( 'https' );
const https_options = {
	key: fs.readFileSync( './https/key.pem' ),
	cert: fs.readFileSync( './https/cert.pem' )
};

function log( err, req, res ){

	if( err ) {
		res.end( '' + err );
		let length = Date.now() - res.start,
			stack = err.stack.split( /[\s]*\n[\s]*at /g );
		stack.shift();
		logFile.append( JSON.stringify({'method':req.method,'length':length,'request':req.file,'error':{'code':err.code,'message':err.message,'stack':err.stack}}) + '\n', function(){} );
	}
	else {
		let length = Date.now() - res.start;
		logFile.append( JSON.stringify({'method':req.method,'length':length,'request':req.file,'code':res.httpCode.getCode()}) + '\n', function(){} );
	}
}

const server = https.createServer( https_options, ( req, res ) => {
	res.start = Date.now();
	return motor.execute( req, res, log );
});

const hostname = '127.0.0.1';
const port = 443;
server.listen( port, hostname, () => {
	return console.log( `Server running at https://${hostname}:${port}/` );
});
