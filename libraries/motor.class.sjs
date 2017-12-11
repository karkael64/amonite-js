const http = require( 'http' );
const type = require( './types.sjs' );
const Event = require( './event.class.sjs' );
const HttpCode = require( './http-code.class.sjs' );
const Content = require( './content.class.sjs' );

HttpCode.DEBUG_MODE = true;

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
		this.on( 'configure', ( req, res, success, failure )=>{
			try {
				fn( req, res, success, failure );
			}
			catch( err ) {
				failure( err );
			}
		} );
	}

	registerController( fn ) {
		this.on( 'controller', ( req, res, success, failure )=>{
			try {
				fn( req, res, success, failure );
			}
			catch( err ) {
				failure( err );
			}
		} );
	}

	configure( success, failure ) {
		let incr = 0,
			len = this.count( 'configure' ),
			has_error = false,
			id = setTimeout( () => { failure( new Error( 'Configuration is time out.' ) ) }, 1000 ),
			args = [
				this.req,
				this.res,
				() => {
					incr++;
					if( incr >= len ){
						clearTimeout( id );
						has_error ? failure( has_error ) : success();
					}
				},
				( err ) => {
					incr++;
					has_error = err;
					if( incr >= len ){
						clearTimeout( id );
						failure( has_error );
					}
				}
			];

		this.dispatch( 'configure', args );
	}

	getController( success, failure ) {
		let id = setTimeout( () => { failure( new Error( 'Controller selection is time out.' ) ) }, 1000 ),
			done = false,
			len = this.count( 'controller' ),
			incr = 0,
			args = [
				this.req,
				this.res,
				( fn ) => {
					incr++;
					if( type.is_function( fn ) && !done ){
						clearTimeout( id );
						done = true;
						return success( fn );
					}
					if( incr >= len && !done ){
						clearTimeout( id );
						done = true;
						return failure( new Error( 'No controller found.' ) );
					}
				},
				() => {
					incr++;
					if( incr >= len && !done ){
						clearTimeout( id );
						done = true;
						return failure( new Error( 'No controller found.' ) );
					}
				}
			];

		this.dispatch( 'controller', args );
	}

	getAnswer( controller, success, failure ) {

		let id = setTimeout( ()=>{ failure( new Error( 'Controller answer is time out.' ) ); }, 1000 );
		try{
			controller( this.req, this.res, ( answer ) => {

				if( type.is_function( answer ) )
					return answer( this.req, this.res, ( answer )=>{
						clearTimeout( id );
						if( type.is_string( answer ) )
							return success( answer );
						else
							return failure( new Error( "Answer is not a string!" ) );
					}, ( err )=>{
						clearTimeout( id );
						return failure( err );
					} );

				if( answer instanceof Content )
					return answer.getContent( this.req, this.res, ( answer )=>{
						clearTimeout( id );
						if( type.is_string( answer ) )
							return success( answer );
						else
							return failure( new Error( "Answer is not a string!" ) );
					}, ( err )=>{
						clearTimeout( id );
						return failure( err );
					} );

				clearTimeout( id );

				if( answer instanceof Buffer )
					answer = answer.toString();
				if( type.is_string( answer ) )
					return success( answer );
				else
					return failure( new Error( "Answer is not a string!" ) );
			}, (a,b,c,d)=>{
				clearTimeout( id );
				return failure(a,b,c,d);
			} );
		}
		catch( err ){
			clearTimeout( id );
			failure( err );
		}
	}

	getHttpCode( answer, success, failure ) {

		if( answer instanceof HttpCode ){
			return success( answer );
		}

		try{
			if( type.is_string( answer ) ){
				if( answer.length === 0 )
					return success( new HttpCode( 204 ) );

				let etag = Content.bodyEtag( answer ), req_etag = this.req.headers[ 'if-none-match' ];
				if( etag === req_etag )
					return success( new HttpCode( 304 ) );

				return success( new HttpCode( 200, answer ) );
			}
			else {
				return failure( new Error( 'Answer is not a string.' ) );
			}
		}
		catch( err ){
			return failure( err );
		}
	}

	sendHttpCode( httpCode, success, failure ) {

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
				return success( this.req, this.res );
			}
			if( code === 307 ){
				let body = httpCode.getMessage();
				this.res.writeHead( code, title, { 'Location': body } );
				this.res.end( body );
				return success( this.req, this.res );
			}
			if( code === 308 ){
				let body = httpCode.getMessage();
				this.res.writeHead( code, title, { 'Location': body } );
				this.res.end( body );
				return success( this.req, this.res );
			}

			let body = httpCode.getContent( this.req );
			this.res.writeHead( code, title, {
				'Content-length': body_length( body ),
				'Content-type': Content.getFilenameMime( this.req.file )
			} );
			this.res.end( body );
			return success( this.req, this.res );
		}
		else
			return failure( this.req, this.res, new Error( 'First parameter is not an HttpCode instance.' ) );
	}

	clone() {
		let motor = new Motor();
		motor.__events__.configure = this.__events__.configure;
		motor.__events__.controller = this.__events__.controller;
		return motor;
	}

	send( success, failure ) {
		let self = this;

		let _failure = ( err ) => {
			if( err instanceof HttpCode ) {
				self.sendHttpCode( err, success, failure )
			}
			else {
				self.sendHttpCode( new HttpCode( 500, "Unexpected error.", err ), success, failure )
			}
		};
		let _notFound = () => {
			self.sendHttpCode( new HttpCode( 404 ), success, failure );
		};

		self.configure( () => {
			self.getController( ( ctrl ) => {
				self.getAnswer( ctrl, ( answer ) => {
					self.getHttpCode( answer, ( httpCode ) => {
						self.sendHttpCode( httpCode, success, failure );
					}, ( err ) => {
						_failure( err );
					} );
				}, ( err ) => {
					_failure( err );
				} );
			}, ( err ) => {
				_notFound( err );
			} )
		}, ( err ) => {
			_failure( err );
		} );
	}
}


module.exports = Motor;

