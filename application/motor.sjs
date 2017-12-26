/*
 *  This file :
 *  1.  instanciate a Motor object,
 *  2.  set ${req <Http.IncomingMessage>}.file as ${req}.url, and if it ends with '/', replace it by '/index.html'
 *  3.  set ${req}.arguments as an Arguments instance
 *  4.  set ${req}.arguments.
 *  Then exports this motor instance.
 */

const ctrls = require( './controllers.sjs' );
const Arguments = require( '../libraries/arguments.class.sjs' );
const Motor = require( '../libraries/motor.class.sjs' );

const motor = new Motor();

motor.registerConfiguration( ( req, res, next ) => {
	req.file = req.url.replace( /(\?|#).*$/, '' ).replace( /\/$/, '/index.html' );
	req.arguments = new Arguments();
	req.arguments.set( req, next );
} );

motor.registerController( ctrls.simpleFile );
motor.registerController( ctrls.execFile );
motor.registerController( ctrls.hiddenFile );

module.exports = motor;