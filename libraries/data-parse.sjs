/*
 *  These functions are used for string parsing to Javascript/JSON usable objects.
 *  There is :
 *  -   a url parser
 *  -   an hash parser
 *  -   a cookie parser
 *  -   a formdata parser
 *  -   utf-8 decoder/encoder
 */

const type = require( 'types' );


/**
 *  @function parse is used to parse ${text}, isolate couple by ${separator_symbol} and separate key and value of a couple with ${equiv_symbol}.
 *  @warn if ${equiv_symbol} is undefined or the couple doesn't match, then the couple is the key and the value is true.
 *  @param text string
 *  @param separator_symbol string|Regexp
 *  @param equiv_symbol undefined|string
 *  @return {{}}
 */

function parse( text, separator_symbol, equiv_symbol ) {
	let result = {},
		items = text.split( separator_symbol );
	items.forEach( ( item ) => {
		let s;
		if( !type.is_undefined( equiv_symbol ) && ( s = item.indexOf( equiv_symbol ) ) ) {
			result[ item.substr( 0, s ) ] = item.substr( s + equiv_symbol.length );
		}
		else
			result[ item ] = true;
	} );
	return result;
}


/**
 * @function parse_uri is used to parse and decode each key and value from uri encode.
 * @param text string
 * @param separator_symbol string|regexp
 * @param equiv_symbol string|undefined
 * @returns {{}}
 */

function parse_uri( text, separator_symbol, equiv_symbol ) {
	let result = {},
		items = text.split( separator_symbol );
	items.forEach( ( item ) => {
		let s;
		if( !type.is_undefined( equiv_symbol ) && ( s = item.indexOf( equiv_symbol ) ) ) {
			let h = decodeURI( item.substr( 0, s ) ),
				v = decodeURIComponent( item.substr( s + equiv_symbol.length ) );
			try { result[ h ] = JSON.parse( v ); }
			catch( e ) { result[ h ] = v; }
		}
		else
			result[ item ] = true;
	} );
	return result;
}


/**
 * @function url_parse can parse an URL arguments string.
 * @param url string
 * @returns {*}|null
 */

function url_parse( url ) {
	let filter = url.match( /\?([^#]*)(#|$)/ );
	return filter ? parse_uri( filter[ 1 ], '&', '=' ) : null;
}


/**
 * @function hash_parse can parse an Hash arguments string, where '/' is couple separator and ':' key/value separator.
 * @param url
 * @returns {*}|null
 */

function hash_parse( url ) {
	let filter = url.match( /#.*$/ );
	return filter ? parse_uri( filter[ 0 ], '/', ':' ) : null;
}

/**
 * @function hash_parse can parse an Hash arguments string, where '/' is couple separator and ':' key/value separator.
 * @param request_cookies string
 * @returns {*}|null
 */

function cookies_parse( request_cookies ) {
	return parse_uri( request_cookies, /;\s*/g, '=' );
}


/**
 * @function headline_parse is used to parse a fomr data headline or a Request/Response header line.
 * @param text string
 * @returns {{field: {}, options: {}}}
 */

function headline_parse( text ) {
	let options = text.split( /;/g ),
		main = options.shift(),
		t = main.match( /^\s*([^:]+):\s*([^:]+)\s*$/ ),
		obj = {};
	obj[ t[ 1 ].toLowerCase() ] = t[ 2 ];

	let res = {
		'field': obj,
		'options': {}
	};

	options.forEach( ( text ) => {
		let t = text.match( /^\s*([^=]+)=\s*([^=]+)\s*$/ ),
			k = t[ 1 ].toLowerCase(),
			v = t[ 2 ];

		try{
			v = JSON.parse( v );
		}
		catch( e ){
		}

		res.options[ k ] = v;
	} );

	return res;
}

/**
 * @function read_each_line is recursively called to read a text, separated by '\n'.
 * @param text
 * @param fn
 */

function read_each_line( text, fn ) {
	if( type.is_string( text ) && type.is_function( fn ) ){
		let t, r, line = '';
		while( t = text.match( /\r?\n/ ) ){
			let endline = t[ 0 ];
			r = text.indexOf( endline );
			line = text.substr( 0, r );
			text = text.substr( r + endline.length );
			fn( line, endline );
		}
	}
}

/**
 * @function formdata_parse is used to parse a text formatted as a formdata and returns is equivalent object.
 * @param text string
 * @param boundary string
 * @returns {*}
 */

function formdata_parse( text, boundary ) {
	if( type.is_string( text ) && type.is_string( boundary ) ){
		let mode_body = false,
			all = [],
			current = null,
			body = '',
			prev_endline = '';

		read_each_line( text, ( line, endline ) => {

			if( line.match( boundary ) ){
				if( type.is_object( current ) ){
					current.body = body;
					all.push( current );
				}
				body = '';
				prev_endline = '';
				current = { 'head': [] };
				return mode_body = false;
			}
			if( !mode_body && !line.length )
				return mode_body = true;

			if( !mode_body ){
				( function( line ){
					current.head.push( headline_parse( line ) );
				})( line, endline );
			}
			else {
				( function( line, endline ){
					body += prev_endline + line;
					prev_endline = endline;
				})( line, endline );
			}
		});

		if( type.is_object( current ) && type.is_list( current.head ) && current.head.length ){
			current.body = body;
			all.push( current );
		}
		return all;
	}
	return null;
}


/**
 * @function utf8_encode is used to translate a binary text to an utf-8 text.
 * @param text string
 * @returns string
 */

function utf8_encode( text ) {
	return ( new Buffer( text, 'binary' ) ).toString();
}

/**
 * @function utf8_decode is used to translate an utf-8 text to a binary text.
 * @param text string
 * @returns string
 */

function utf8_decode( text ) {
	return ( new Buffer( text ) ).toString( 'binary' );
}


module.exports = {
	'formdata_parse': formdata_parse,
	'url_parse': url_parse,
	'hash_parse': hash_parse,
	'cookies_parse': cookies_parse,
	'parse': parse,
	'parse_uri': parse_uri,
	'utf8_encode': utf8_encode,
	'utf8_decode': utf8_decode
};

