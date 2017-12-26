const HttpCode = require( './libraries/http-code.class.sjs' );
HttpCode.DEBUG_MODE = true;

const motor = require( './application/motor.sjs' );

const http = require( 'http' );

function log( err, req, res ){

	if( err ) {
		res.end( '' + err );
		let dt = Date.now(),
			start = req.custom.start;
		console.log( `${req.method} failure! length=${dt - start}ms request=${JSON.stringify(req.file.substr(0,40))}` );
		console.error( `${req.method} failure! length=${dt - start}ms request=${JSON.stringify(req.file.substr(0,40))}` );
	}
	else {
		let dt = Date.now(),
			start = req.custom.start,
			code = req.custom.code;
		console.log( `${req.method} code=${code} length=${dt - start}ms request=${JSON.stringify(req.file.substr(0,40) )}` );
	}
}

const server = http.createServer( ( req, res ) => {
	req.custom = { 'start': Date.now() };
	motor.clone().settings( req, res ).send( log );
} );

const hostname = '127.0.0.1';
const port = 8000;
server.listen( port, hostname, () => {
	console.log( `Server running at http://${hostname}:${port}/` );
} );
