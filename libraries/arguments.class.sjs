/*
 *  Arguments Object is used to stock each data sent by Client.
 *  The main functionalities are the form-data parser and his file reader.
 *
 *  To set this class, please use it like this :
 *  let arguments = new Arguments;
 *  arguments.set( req, ( err )=>{...} )
 *
 *  By this way, Argument instance will read and split data sent by client and then call the callback.
 */

const type = require( './types.sjs' );
const parse = require( './data-parse.sjs' );
const http = require( 'http' );

function post_reader( request, next ) {

	if( request instanceof http.IncomingMessage && type.is_function( next ) ){

		try {
			let method = request.method.toUpperCase();

			if( [ 'POST', 'PUT', 'CONNECT', 'PATCH' ].indexOf( method ) !== -1 ){

				let content_type = request.headers[ 'content-type' ] || '',
					type_url = 'application/x-www-form-urlencoded',
					type_form = 'multipart/form-data',
					type_json = 'application/json';

				if( content_type.indexOf( type_url ) || content_type.indexOf( type_form ) || content_type.indexOf( type_json ) ){

					let body = '';

					request.on( 'data', ( data ) => {

						try {
							if( data instanceof Buffer ) {
								body += data.toString( 'binary' );
								if( body.length > 1e7 )
									request.connection.destroy();
							}
						}
						catch( err ) {
							next( err );
						}
					});

					request.on( 'end', () => {

						try {
							let data = body;

							if( content_type.indexOf( type_json ) !== -1 )
								return next( null, JSON.parse( data ) );

							if( content_type.indexOf( type_url ) !== -1 )
								return next( null, parse.url_parse( data ) );

							if( content_type.indexOf( type_form ) !== -1 ){
								let boundary = content_type.match( /boundary=([^\s;]+)/ )[ 1 ];
								return next( null, parse.formdata_parse( data, boundary ) );
							}
						}
						catch( err ) {
							next( err );
						}
					});
				}
				else {
					next( new Error( `This motor only read ${type_json}, ${type_url} or ${type_form} documents. Sorry!` ) );
				}
			}
			else {
				next( null );
			}
		}
		catch( err ){
			next( err );
		}
	}
	else {
		throw new Error( 'Bad arguments!' );
	}
}


class Arguments {

	constructor() {
		this.url_args = {};
		this.data_args = {};
		this.hash_args = {};
		this.cookies_args = {};
	}

	//  setter
	setUrlArguments( data ) {
		if( type.is_object( data ) )
			this.url_args = data;
		if( type.is_string( data ) )
			this.url_args = parse.url_parse( data );
	}

	setHashArguments( data ) {
		if( type.is_object( data ) )
			this.hash_args = data;
		if( type.is_string( data ) )
			this.hash_args = parse.hash_parse( data );
	}

	setCookies( data ) {
		if( type.is_object( data ) )
			this.cookies_args = data;
		if( type.is_string( data ) )
			this.cookies_args = parse.cookies_parse( data );
	}

	setData( data, boundary ) {
		if( type.is_object( data ) )
			this.data_args = data;
		if( type.is_string( data ) && type.is_string( boundary ) )
			this.data_args = parse.formdata_parse( data, boundary );
	}

	set( request, next ) {
		if( request instanceof http.IncomingMessage ){
			this.setUrlArguments( request.url );
			this.setHashArguments( request.url );
			this.setCookies( request.headers.cookie );
			let ctx = this;
			post_reader( request, ( err, data ) => {
				if( err ) {
					next( err );
				}
				else {
					ctx.setData( data );
					next();
				}
			});
		}
		else
			failure( new Error( "Bad arguments!" ) );
	}

	//  getter
	getUrlArgument( name ) {
		let t;
		return this.url_args && ( t = this.url_args[ name ] ) && t || null;
	}

	getHashArgument( name ) {
		let t;
		return this.hash_args && ( t = this.hash_args[ name ] ) && t || null;
	}

	getCookie( name ) {
		let t;
		return this.cookies_args && ( t = this.cookies_args[ name ] ) && t || null;
	}

	getDataObject( name ) {
		let found = null;
		if( type.is_string( name ) && type.is_list( this.data_args ) ){
			this.data_args.forEach( ( arg ) => {
				arg.head.forEach( ( h ) => {
					if( h.options.name === name )
						found = arg;
				} );
			} );
		}
		return found;
	}

	getDataOptions( name ) {
		let res = {}, arg;
		if( type.is_string( name ) && ( arg = this.getDataObject( name ) ) ){
			arg.head.forEach( ( head ) => {
				if( type.is_object( head.field ) ) {
					for( let key in head.field ) {
						res[ key ] = head.field[ key ];
					}
				}
				if( type.is_object( head.options ) ) {
					for( let key in head.options ) {
						res[ key ] = head.options[ key ];
					}
				}
			});
		}
		return res;
	}

	getData( name ) {
		let obj = this.getDataObject( name );
		if( type.is_object( obj ) ){
			return obj.body;
		}
		else {
			return null;
		}
	}

	getAllData() {
		let found = {};
		if( type.is_list( this.data_args ) ){
			this.data_args.forEach( ( arg ) => {
				arg.head.forEach( ( h ) => {
					if( h.options.name )
						found[ h.options.name ] = arg.body;
				} );
			} );
		}
		return found;
	}

	get( name ) {
		return this.getUrlArgument( name ) || this.getData( name ) || this.getHashArgument( name ) || this.getCookie( name ) || null;
	}

	toJSON() {
		let res = {};
		for( let a in this.url_args )
			res[ a ] = this.url_args[ a ];
		let t = this.getAllData();
		for( let a in t )
			res[ a ] = t[ a ];
		for( let a in this.hash_args )
			res[ a ] = this.hash_args[ a ];
		for( let a in this.cookies_args )
			res[ a ] = this.cookies_args[ a ];
		return res;
	}
}

module.exports = Arguments;