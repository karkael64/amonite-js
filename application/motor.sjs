const ctrls = require( './controllers.sjs' );
const Arguments = require( '../libraries/arguments.class.sjs' );
const Motor = require( '../libraries/motor.class.sjs' );

const motor = new Motor();

motor.registerConfiguration( ( req, res, success, failure ) => {
	req.file = req.url.replace( /(\?|#).*$/, '' ).replace( /\/$/, '/index.html' );
	req.arguments = new Arguments();
	req.arguments.set( req, success, failure );
} );

motor.registerController( ctrls.simpleFile );
motor.registerController( ctrls.execFile );
motor.registerController( ctrls.hiddenFile );

module.exports = motor;