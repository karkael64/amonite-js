/*
 *  This file :
 *  1.  instanciate a Motor object,
 *  2.  set ${req <Http.IncomingMessage>}.file as ${req}.url, and if it ends with '/', replace it by '/index.html'
 *  3.  set ${req}.arguments as an Arguments instance
 *  4.  set ${req}.arguments.
 *  Then exports this motor instance.
 */

const ctrls = require( './controllers.sjs' );
const Arguments = require( 'http-arguments' );
const Motor = require( '../libraries/motor.class.sjs' );
const logFile = require( '../node_modules/bson/file.js' ).build( './application/log.bson' );

const motor = new Motor();

motor.registerConfiguration( ( req, res, next ) => {
    res.start = Date.now();
	req.file = req.url.replace( /(\?|#).*$/, '' ).replace( /\/$/, '/index.html' );
	let a = new Arguments();
	a.set( req, next );
    req.arguments = a;
} );

motor.log = function log( err, req, res ){

	if( err ) {
		res.end( '' + err );
		let length = Date.now() - res.start,
			stack = err.stack.split( /[\s]*\n[\s]*at /g );
		stack.shift();
		logFile.append( JSON.stringify({'method':req.method,'length':length,'request':req.file,'error':{'code':err.code,'message':err.message,'stack':err.stack,'date':Date.now()}}) + '\n', function(){} );
	}
	else {
		let length = Date.now() - res.start;
		logFile.append( JSON.stringify({'method':req.method,'length':length,'request':req.file,'code':res.httpCode.getCode(),'date':Date.now()}) + '\n', function(){} );
	}
};

motor.registerController( ctrls.simpleFile );
motor.registerController( ctrls.execFile );
motor.registerController( ctrls.hiddenFile );

module.exports = motor;