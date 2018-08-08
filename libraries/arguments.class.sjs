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

const type = require( 'types' );
const parse = require( './data-parse.sjs' );
const http = require( 'http' );

/**
 * @function request_body_reader reads request body content if request method is POST, PUT, CONNECT or PATCH. The body is parsed
 * and send in object, with 3 encode-types : url, formdata, json.
 * @param request Http.IncomingMessage
 * @param next function( Error|null err, Object data )
 */

function request_body_reader( request, next ) {

	if( request instanceof http.IncomingMessage && type.is_function( next ) ){

		try {
			let method = request.method.toUpperCase();

			if( [ 'POST', 'PUT', 'CONNECT', 'PATCH' ].indexOf( method ) !== -1 ){

				let content_type = request.headers[ 'content-type' ] || '',
					type_url = ( content_type.indexOf('application/x-www-form-urlencoded') !== -1 ),
					type_form = ( content_type.indexOf('multipart/form-data') !== -1 ),
					type_json = ( content_type.indexOf('application/json') !== -1 );

				if( type_url || type_form || type_json ){

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
							if( type_json )
								return next( null, JSON.parse( body ) );

							if( type_url )
								return next( null, parse.url_parse( body ) );

							if( type_form ){
								let boundary = content_type.match( /boundary=([^\s;]+)/ )[ 1 ];
								return next( null, parse.formdata_parse( body, boundary ) );
							}
						}
						catch( err ) {
							next( err );
						}
					});
				}
				else {
					next( new Error( 'This motor only read "application/json" or "application/x-www-form-urlencoded" or '+
						'"multipart/form-data" request body content types. Sorry!' ) );
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


/**
 * @class Arguments is a constructor for parsing request headers and body, and easy seeking them.
 */

class Arguments {

	/**
	 * @method constructor initialize each 4 data type : url args, hash args, body, cookies
	 * @return Arguments
	 */

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

	setData( data ) {
		if( type.is_object( data ) )
			this.data_args = data;
		if( type.is_string( data ) )
			this.data_args = {'body':data};
	}

	/**
	 * @function set is used to set each data types. For the async request body reader, please use a callback for the
	 * second parameter.
	 * @param request http.IncomingMessage
	 * @param next function( err, data )
	 */

	set( request, next ) {
		if( request instanceof http.IncomingMessage ){
			this.setUrlArguments( request.url );
			this.setHashArguments( request.url );
			this.setCookies( request.headers.cookie );
			let self = this;
			request_body_reader( request, ( err, data ) => {
				if( err ) {
					next( err );
				}
				else {
					self.setData( data );
					next();
				}
			});
		}
		else
			next( new Error( "Bad arguments!" ) );
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

	/**
	 * @method getDataObject returns formdata decrypted field ${name}.
	 * This function is often used by .getDataOptions and .getData
	 * @param name
	 * @returns {
	 *      "head":[{
	 *          "field":{},
	 *          "options":[{}, …]
	 *      }, …],
	 *      "body":""
	 *  }
	 */

	getDataObject( name ) {
		let found = null;
		if( type.is_string( name ) && type.is_list( this.data_args ) ){
			this.data_args.forEach( ( arg, field ) => {
				if( type.is_list( arg.head ) && !type.is_undefined( arg.body ) ) {
					arg.head.forEach( ( h ) => {
						if( h.options.name === name )
							found = arg;
					} );
				}
				else {
					if( field === name ) {
						found = {
							"head":[{
								"field": field,
								"options": []
							}],
							"body": arg
						};
					}
				}
			} );
		}
		return found;
	}

	/**
	 * @method getDataOptions returns an object with raw parameters.
	 * @param name string
	 * @returns [{}, …]
	 */

	getDataOptions( name ) {
		let res = {}, arg;
		if( type.is_string( name ) && ( arg = this.getDataObject( name ) ) ){
			arg.head.forEach( ( head ) => {
				if( type.is_object( head.field ) ){
					for( let key in head.field ){
						res[ key ] = head.field[ key ];
					}
				}
				if( type.is_object( head.options ) ){
					for( let key in head.options ){
						res[ key ] = head.options[ key ];
					}
				}
			} );
		}
		return res;
	}

	/**
	 * @method getData returns formdata's body from request's body
	 * @param name string
	 * @returns string
	 */

	getData( name ) {
		let obj = this.getDataObject( name );
		if( type.is_object( obj ) ){
			return obj.body;
		}
		else {
			return null;
		}
	}

	/**
	 * @method getAllData returns every request body extracted arguments.
	 * This function is used by .toJSON for example.
	 * @returns {{}}
	 */

	getAllData() {
		let found = {};
		if( type.is_list( this.data_args ) ){
			this.data_args.forEach( ( arg, field ) => {
				if( type.is_list( arg.head ) && !type.is_undefined( arg.body ) ) {
					arg.head.forEach( ( h ) => {
						if( h.options.name )
							found[ h.options.name ] = arg.body;
					} );
				}
				else {
					found[ field ] = arg;
				}
			} );
		}
		return found;
	}

	/**
	 * @method get is used to get parameter ${name} value through each 4 argument types, prioritized by Url, Body, Hash and
	 * then Cookie. Returns null if not found.
	 * @param name string
	 * @returns ""|null
	 */

	get( name ) {
		return this.getUrlArgument( name ) || this.getData( name ) || this.getHashArgument( name ) || this.getCookie( name ) || null;
	}

	/**
	 * @method .toJSON is used to get every arguments of each 4 argument types.
	 * @returns {{}}
	 */

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