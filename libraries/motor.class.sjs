const http = require( 'http' );
const type = require( './types.sjs' );
const Event = require( './event.class.sjs' );
const HttpCode = require( './http-code.class.sjs' );
const Content = require( './content.class.sjs' );

/**
 * @alias Buffer.byteLength
 * @param body string|buffer
 * @returns {Number}
 */

function body_length( body ) {
	return Buffer.byteLength( body );
}

/**
 * @class Motor is a configurable engine to handle Http requests and return a correct answer to the user. In 3 steps :
 * 1. create a standard motor, where you register configuration and controller functions,
 * 2. clone it and set in it the Request and the Response,
 * 3. then send in it a request, response and a callback at the end.
 *
 * The motor handle request and controller responses in 5 steps :
 * a. read request and configure,
 * b. get the matching controller,
 * c. get the controller answer,
 * d. cast controller answer in an HttpCode object,
 * e. send HttpCode content to the client.
 */

class Motor extends Event {

	/**
	 * @function clone a new Motor based on the original configure and controller functions.
	 * @returns {Motor}
	 */

	clone() {
		let motor = new Motor();
		motor.__events__.configure = this.__events__.configure;
		motor.__events__.controller = this.__events__.controller;
		return motor;
	}

	/**
	 * @function settings register Request and Response objects before usage.
	 * @param req http.IncomingMessage
	 * @param res http.ServerResponse
	 * @returns {Motor}
	 */

	settings( req, res ) {
		if( req instanceof http.IncomingMessage && res instanceof http.ServerResponse ){
			this.req = req;
			this.res = res;
		}
		else {
			throw new Error( 'Bad arguments!' );
		}
		return this;
	}

	/**
	 * @function registerConfiguration record a function to be called when to configure it.
	 * @param fn function( Http.IncomingMessage req, Http.ServerResponse res, function next( Error err ) )
	 */

	registerConfiguration( fn ) {
		this.on( 'configure', ( req, res, next )=>{
			try {
				fn( req, res, next );
			}
			catch( err ) {
				next( err );
			}
		} );
	}

	/**
	 * @function registerController record a function which send a function to execute if it matches with request.
	 * @param fn function( Http.IncomingMessage req, Http.ServerResponse res, function next( Error err ) )
	 */

	registerController( fn ) {
		this.on( 'controller', ( req, res, next )=>{
			try {
				fn( req, res, next );
			}
			catch( err ) {
				next( err );
			}
		} );
	}

	/**
	 * @function configure send all registered configuration functions.
	 * @param next function( Error err )
	 */

	configure( next ) {
		let len = this.count( 'configure' );

		if( len ) {
			let incr = 0,
				has_error = false,
				id = setTimeout( () => { next( new Error( 'Configuration is time out.' ) ) }, 1000 ),
				args = [
					this.req,
					this.res,
					( err ) => {
						incr++;
						if( err )
							has_error = err;
						if( incr >= len ){
							clearTimeout( id );
							has_error ? next( has_error ) : next();
						}
					}
				];
			this.dispatch( 'configure', args );
		}
		else {
			next();
		}
	}

	/**
	 * @function getController try every controllers and the first match is send in the callback.
	 * @param next function( Error err, function fn( Http.IncomingMessage req, Http.ServerResponse res, function next( Error err, string|Buffer|Content answer ) ) )
	 */

	getController( next ) {
		let len = this.count( 'controller' );
		if( len ) {
			let id = setTimeout( () => { next( new Error( 'Controller selection is time out.' ) ) }, 1000 ),
				done = false,
				incr = 0,
				args = [
					this.req,
					this.res,
					( err, fn ) => {
						incr++;
						if( err ) {
							if( incr >= len && !done ){
								clearTimeout( id );
								done = true;
								return next( new Error( 'No controller found.' ) );
							}
						}
						else {
							if( type.is_function( fn ) && !done ){
								clearTimeout( id );
								done = true;
								return next( null, fn );
							}
							if( incr >= len && !done ){
								clearTimeout( id );
								done = true;
								return next( new Error( 'No controller found.' ) );
							}
						}
					}
				];
			this.dispatch( 'controller', args );
		}
		else {
			next( new Error( 'No controller registered.' ) );
		}
	}

	/**
	 * @function getAnswer is used to execute a controller. Controller response should be a String, a Buffer or a
	 * Content object.
	 * @param controller function( Http.IncomingMessage req, Http.ServerResponse res, function next( Error err, string|Buffer|Content answer ) )
	 * @param next function( Error err, string answer )
	 */

	getAnswer( controller, next ) {

		let id = setTimeout( ()=>{ next( new Error( 'Controller answer is time out.' ) ); }, 1000 );
		try{
			controller( this.req, this.res, ( err, answer ) => {

				if( err ) {
					clearTimeout( id );
					return next( err );
				}
				else {
					if( type.is_function( answer ) )
						return answer( this.req, this.res, ( err, answer )=>{
							if( err ) {
								clearTimeout( id );
								return next( err );
							}
							else {
								clearTimeout( id );
								if( answer instanceof Buffer ) answer = answer.toString();
								if( type.is_string( answer ) ) return next( null, answer );
								else return next( new Error( "Answer is not a string!" ) );
							}
						});

					if( answer instanceof HttpCode )
						return next( null, answer );

					if( answer instanceof Content )
						return answer.getContent( this.req, this.res, ( err, answer )=>{
							if( err ) {
								clearTimeout( id );
								return next( err );
							}
							else {
								clearTimeout( id );
								if( answer instanceof Buffer ) answer = answer.toString();
								if( type.is_string( answer ) ) return next( null, answer );
								else return next( new Error( "Answer is not a string!" ) );
							}
						});

					clearTimeout( id );
					if( answer instanceof Buffer ) answer = answer.toString();
					if( type.is_string( answer ) ) return next( null, answer );
					else return next( new Error( "Answer is not a string!" ) );
				}
			});
		}
		catch( err ){
			clearTimeout( id );
			next( err );
		}
	}

	/**
	 * @function getHttpCode is used to transform controller answer to an HttpCode. This function prevent cache
	 * controls.
	 * @param answer string
	 * @param next function( Error err, HttpCode answer )
	 */

	getHttpCode( answer, next ) {

		if( answer instanceof HttpCode ){
			return next( null, answer );
		}

		try{
			if( type.is_string( answer ) ){
				if( answer.length === 0 )
					return next( null, new HttpCode( 204 ) );

				let etag = JSON.stringify( Content.bodyEtag( answer ) ),
					req_etag = this.req.headers[ 'if-none-match' ] || this.req.headers[ 'last-modified' ];
				if( etag === req_etag )
					return next( null, new HttpCode( 304 ) );

				return next( null, new HttpCode( 200, answer ) );
			}
			else {
				return next( new Error( 'Answer is not a string.' ) );
			}
		}
		catch( err ){
			return next( err );
		}
	}

	/**
	 * @function sendHttpCode send client Response with an HttpCode object.
	 * @param httpCode HttpCode
	 * @param next function( Error err, Http.IncomingMessage req, Http.ServerResponse res )
	 */

	sendHttpCode( httpCode, next ) {

		if( httpCode instanceof HttpCode ){

			let code = httpCode.getCode(),
				title = httpCode.getTitle();
			this.req.custom.code = code;

			if( code === 200 ){
				let body = httpCode.message,
					url = this.req.file;
				this.res.writeHead( code, title, {
					'Connexion': 'keep-alive',
					'Content-length': body_length( body ),
					'Content-type': Content.getFilenameMime( url ),
					'ETag': JSON.stringify( Content.bodyEtag( body ) ),
					'Cache-control': 'public, max-age=120',
					'Date': ( new Date() ).toGMTString(),
					'Expires': ( new Date( Date.now() + ( 120 * 1000 ) ) ).toGMTString()
				} );
				this.res.end( body );
				return next( null, this.req, this.res );
			}
			if( code === 307 || code === 308 ){
				let body = httpCode.getMessage();
				this.res.writeHead( code, title, { 'Location': body } );
				this.res.end( body );
				return next( null, this.req, this.res );
			}

			return httpCode.getContent( this.req, this.res, ( err, body )=>{
				this.res.writeHead( code, title, {
					'Content-length': body_length( body ),
					'Content-type': Content.getFilenameMime( this.req.file )
				} );
				this.res.end( body );
				return next( null, this.req, this.res );
			} );
		}
		else
			return next( new Error( 'First parameter is not an HttpCode instance.' ), this.req, this.res );
	}

	/**
	 * @function send is a built-in function which configure, get controller, get its answer, wrap it in an HttpCode and
	 * send HttpCode as client response.
	 * @param next function( Error err, Http.IncomingMessage req, Http.ServerResponse res )
	 */

	send( next ) {
		let self = this;

		let _failure = ( err ) => {
			if( err instanceof HttpCode ) {
				self.sendHttpCode( err, next );
			}
			else {
				if( err instanceof Error ) {
					self.sendHttpCode( new HttpCode( 500, "Unexpected error", err ), next );
				}
				else {
					self.sendHttpCode( new HttpCode( 500, "Not an error format" ), next );
				}
			}
		};

		let _notFound = () => {
			self.sendHttpCode( new HttpCode( 404 ), next );
		};

		self.configure( ( err ) => {

			if( err ) {
				_failure( err );
			}
			else {
				self.getController( ( err, ctrl ) => {
					if( err ) {
						_notFound( err );
					}
					else {
						self.getAnswer( ctrl, ( err, answer ) => {
							if( err ) {
								_failure( err );
							}
							else {
								self.getHttpCode( answer, ( err, httpCode ) => {
									if( err ) {
										_failure( err );
									}
									else {
										self.sendHttpCode( httpCode, next );
									}
								});
							}
						});
					}
				})
			}
		});
	}
}

module.exports = Motor;

