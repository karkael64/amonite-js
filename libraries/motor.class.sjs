const http = require( 'http' );
const type = require( './types.sjs' );
const Event = require( './event.class.sjs' );
const HttpCode = require( './http-code.class.sjs' );
const Content = require( './content.class.sjs' );

function body_length( body ) {
	return Buffer.byteLength( body );
}

class Motor extends Event {

	constructor() {
		super();
	}

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

	configure( next ) {
		let incr = 0,
			len = this.count( 'configure' ),
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

	getController( next ) {
		let id = setTimeout( () => { next( new Error( 'Controller selection is time out.' ) ) }, 1000 ),
			done = false,
			len = this.count( 'controller' ),
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

	getAnswer( controller, next ) {

		let id = setTimeout( ()=>{ next( new Error( 'Controller answer is time out.' ) ); }, 1000 );
		try{
			controller( this.req, this.res, ( answer ) => {

				if( type.is_function( answer ) )
					return answer( this.req, this.res, ( answer )=>{
						clearTimeout( id );
						if( type.is_string( answer ) )
							return next( null, answer );
						else
							return next( new Error( "Answer is not a string!" ) );
					}, ( err )=>{
						clearTimeout( id );
						return next( err );
					} );

				if( answer instanceof Content )
					return answer.getContent( this.req, this.res, ( answer )=>{
						clearTimeout( id );
						if( type.is_string( answer ) )
							return next( null, answer );
						else
							return next( new Error( "Answer is not a string!" ) );
					}, ( err )=>{
						clearTimeout( id );
						return next( err );
					} );

				clearTimeout( id );

				if( answer instanceof Buffer )
					answer = answer.toString();
				if( type.is_string( answer ) )
					return next( null, answer );
				else
					return next( new Error( "Answer is not a string!" ) );
			}, (a,b,c,d)=>{
				clearTimeout( id );
				return next(a,b,c,d);
			} );
		}
		catch( err ){
			clearTimeout( id );
			next( err );
		}
	}

	getHttpCode( answer, next ) {

		if( answer instanceof HttpCode ){
			return next( null, answer );
		}

		try{
			if( type.is_string( answer ) ){
				if( answer.length === 0 )
					return next( null, new HttpCode( 204 ) );

				let etag = Content.bodyEtag( answer ), req_etag = this.req.headers[ 'if-none-match' ];
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

	sendHttpCode( httpCode, next ) {

		if( httpCode instanceof HttpCode ){

			let code = httpCode.getCode(),
				title = httpCode.getTitle();
			this.req.custom.code = code;

			if( code === 200 ){
				let body = httpCode.message,
					url = this.req.file;
				this.res.writeHead( code, title, {
					'Content-length': body_length( body ),
					'Content-type': Content.getFilenameMime( url ),
					'Etag': Content.bodyEtag( body )
				} );
				this.res.end( body );
				return next( null, this.req, this.res );
			}
			if( code === 307 ){
				let body = httpCode.getMessage();
				this.res.writeHead( code, title, { 'Location': body } );
				this.res.end( body );
				return next( null, this.req, this.res );
			}
			if( code === 308 ){
				let body = httpCode.getMessage();
				this.res.writeHead( code, title, { 'Location': body } );
				this.res.end( body );
				return next( null, this.req, this.res );
			}

			let body = httpCode.getContent( this.req );
			this.res.writeHead( code, title, {
				'Content-length': body_length( body ),
				'Content-type': Content.getFilenameMime( this.req.file )
			} );
			this.res.end( body );
			return next( null, this.req, this.res );
		}
		else
			return next( new Error( 'First parameter is not an HttpCode instance.' ), this.req, this.res );
	}

	clone() {
		let motor = new Motor();
		motor.__events__.configure = this.__events__.configure;
		motor.__events__.controller = this.__events__.controller;
		return motor;
	}

	send( next ) {
		let self = this;

		let _failure = ( err ) => {
			if( err instanceof HttpCode ) {
				self.sendHttpCode( err, next )
			}
			else {
				self.sendHttpCode( new HttpCode( 500, "Unexpected error.", err ), next )
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

