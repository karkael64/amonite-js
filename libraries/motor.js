const http = require( 'http' );
const type = require( 'types' );
const EventTarget = require( './event-target' );
const Page = require( './page' );
const Component = require( './component' );
const reviveHttp = require( './http' );
const reviveHttps = require( './https' );
const path = require( 'path' );

const HttpCode = require( 'http-code' );
const Error = HttpCode.prototype.__proto__.constructor;
const Content = Error.prototype.__proto__.constructor;

/**
 * @alias Buffer.byteLength
 * @param body string|buffer
 * @returns {Number}
 */

function body_length( body ) {
	return Buffer.byteLength( body );
}

/**
 * @class Amonite is a configurable engine to handle Http requests and return a correct answer to the user. In 3 steps :
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

class Amonite extends EventTarget {

    constructor(){
        super();
    }

	/**
	 * @function clone a new Amonite based on the original configure and controller functions.
	 * @returns {Amonite}
	 */

	clone() {
		let motor = new Amonite();
		motor.__events__.configure = this.__events__.configure.slice();
		motor.__events__.controller = this.__events__.controller.slice();
        return motor;
	}

	/**
	 * @function settings register Request and Response objects before usage.
	 * @param req http.IncomingMessage
	 * @param res http.ServerResponse
	 * @returns {Amonite}
	 */

	settings( req, res ) {
		if( req instanceof http.IncomingMessage && res instanceof http.ServerResponse ){
		    req.publicPath = Amonite.publicPath;
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
		this.on( 'configure', ( ev, req, res, next )=>{
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
		this.on( 'controller', ( ev, req, res, next )=>{
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
								return next( new Error( 'No controller found.', -1, err ) );
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
                                if( answer instanceof HttpCode ) return next( null, answer );
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
                                if( answer instanceof HttpCode ) return next( null, answer );
								if( answer instanceof Buffer ) answer = answer.toString();
								if( type.is_string( answer ) ) return next( null, answer );
								else return next( new Error( "Answer is not a string or an HttpCode!" ) );
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
					return next( null, new HttpCode( 204, "" ) );

				let etag = JSON.stringify( Content.bodyEtag( answer ) ),
					req_etag = this.req.headers[ 'if-none-match' ] || this.req.headers[ 'last-modified' ];
				if( etag === req_etag )
					return next( null, new HttpCode( 304, "" ) );

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

			this.res.httpCode = httpCode;

			let code = httpCode.getCode(),
				title = httpCode.getTitle(),
				cookies = httpCode.getCookiesToString();

			if( cookies ) httpCode.setHeader( 'Set-Cookie', cookies );

			if( code === 200 ){

				let body = httpCode.message,
					url = this.req.file;

				httpCode.setHeader( 'Connection', 'keep-alive' );
				httpCode.setHeader( 'Content-length', body_length( body ) );
				httpCode.setHeader( 'Content-type', Content.getFilenameMime( url ) );
				httpCode.setHeader( 'ETag', JSON.stringify( Content.bodyEtag( body ) ) );
				httpCode.setHeader( 'Cache-control', 'public, max-age=120' );
				httpCode.setHeader( 'Date', ( new Date() ).toGMTString() );
				httpCode.setHeader( 'Expires', ( new Date( Date.now() + ( 120 * 1000 ) ) ).toGMTString() );

				this.res.writeHead( code, title, httpCode.headers );
				this.res.end( body );
				return next( null, this.req, this.res );
			}
			if( code === 307 || code === 308 ){

				let body = httpCode.getMessage();
				httpCode.setHeader( 'Location', body );

				this.res.writeHead( code, title, httpCode.headers );
				this.res.end( body );
				return next( null, this.req, this.res );
			}

			return httpCode.getContent( this.req, this.res, ( err, body )=>{

				httpCode.setHeader( 'Content-length', body_length( body ) );
				httpCode.setHeader( 'Content-type', Content.getFilenameMime( this.req.file ) );

				this.res.writeHead( code, title, httpCode.headers );
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
					self.sendHttpCode( new HttpCode( 500, "Not an error format", err ), next );
				}
			}
		};

		let _notFound = ( err ) => {
			self.sendHttpCode( new HttpCode( 404, HttpCode.CODES[404].message, err ), next );
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
				});
			}
		});
	}

	execute( req, res, next ) {
		return this.clone().settings( req, res ).send( next );
	}
}

Amonite.logFile = path.normalize( __dirname + '/../../log.bson' );
Amonite.publicPath = path.normalize( __dirname + '/../../theme' ) + '/';

Amonite.prototype.reviveHttp = reviveHttp;
Amonite.prototype.reviveHttps = reviveHttps;

Amonite.HttpCode = HttpCode;
Amonite.Content = Content;
Amonite.Page = Page;
Amonite.Component = Component;

module.exports = Amonite;

