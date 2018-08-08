const type = require( 'types' );
const fs = require( 'fs' );
const pt = require( 'path' );
const Event = require( '../../libraries/event.class.sjs' );


//  private functions

/**
 * @function add is a private function to record next action on this file.
 * @param fn function(*)
 * @param args list
 * @throws Error if ${fn} is not a function and if ${args} is not a list
 */

function add( fn, args ) {
	if( this instanceof File && type.is_function( fn ) && type.is_list( args ) ){
		this.list.push( { "fn": fn, "args": args } );
		next.apply( this );
		return this.list.length;
	}
	else
		throw new Error( "Bad arguments!" );
}

/**
 * @function next is a private function to call at the next action on this file. If there is no more function to call,
 * next dispatch 'end' event.
 */

function next() {
	if( this instanceof File ){
		if( this.list.length && type.is_null( this.sema ) ){
			let o = this.sema = this.list.shift();
			o.fn.apply( this, o.args )
		}
		else
			this.dispatch( 'end' );
	}
	else
		throw new Error( "Bad arguments!" );
}

/**
 * @function wrapNext is a private function which wrap ${fn} for calling at the next function.
 * @param fn function(*)
 * @param self File
 * @returns {function(*)}
 * @throws Error if ${self} is not File instance of ${fn} is not a function
 */

function wrapNext( fn, self ) {
	if( self instanceof File && type.is_function( fn ) )
		return ( ...a ) => {
			self.sema = null;
			fn.apply( null, a );
			next.apply( self );
		};
	else
		throw new Error( "Bad arguments!" );
}


//  async calls

/**
 * @function exists is used to check if this file exists in this system.
 * @param next function( Bool exists )
 * @throws Error if ${next} is not a function
 */

function exists( next ) {
	if( this instanceof File && type.is_function( next ) )
		fs.access( this.path, ( err ) => {
			next( !err );
		} );
	else
		throw new Error( "Bad arguments!" );
}

/**
 * @function read is used to read entire file.
 * @param next function( Error err, string body )
 * @throws Error if ${next} is not a function
 */

function read( next ) {
	if( this instanceof File && type.is_function( next ) )
		fs.readFile( this.path, next );
	else
		throw new Error( "Bad arguments!" );
}

/**
 * @function readEachChunk
 * @param path
 * @param each function( Error err, Number length, Buffer buffer )
 * @param next function( Error err )
 * @throws Error if ${path} is not a string, or ${each} or ${next} is not a function
 */

function readEachChunk( path, each, next ) {

	if( type.is_string( path ) && type.is_function( each ) && type.is_function( next ) ){
		fs.open( path, 'r', function( err, fd ) {
			if( err ) return next( err );
			fs.fstat( fd, function( err, stats ) {
				if( err ) return next( err );
				let bufferSize = stats.size;
				if( bufferSize <= 1 )
					return next();

				let chunkSize = File.CHUNK_SIZE,
					buffer = new Buffer( chunkSize ),
					bytesRead = 0,
					incr = 0;

				let fn = () => {
					if( bytesRead < bufferSize ){
						incr++;
						if( (bytesRead + chunkSize) >= bufferSize ){
							chunkSize = (bufferSize - bytesRead);
							fs.read( fd, buffer, 0, chunkSize, bytesRead, ( err, bytesRead, buffer ) => {
								each( err, bytesRead, buffer.slice( 0, bytesRead ), () => {
									return fs.close( fd, next );
								} );
							} );
						}
						else {
							fs.read( fd, buffer, 0, chunkSize, bytesRead, ( err, bytesRead, buffer ) => {
								each( err, bytesRead, buffer.slice( 0, bytesRead ), fn );
							} );
						}
						bytesRead += chunkSize;
					}
				};
				fn();
			} );
		} );
	}
	else
		throw new Error( "Bad arguments!" );
}

/**
 * @function readEachLine is used to call function ${each) at each end of line.
 * @param each function( Error err, string line, function then() )
 * @param next function( Error err )
 * @throws Error if ${each} or ${next} is not a function
 */

function readEachLine( each, next ) {
	if( this instanceof File && type.is_function( each ) && type.is_function( next ) ){
		let text = '',
			line = '',
			incr = 0,
			closed = false;
		readEachChunk( this.path, ( err, bytesRead, buffer, next_chunk ) => {
			text += buffer.toString();
			let r;
			while( ( r = text.indexOf( '\n' ) ) !== -1 ){
				incr++;
				line = text.substr( 0, r ).trim();
				text = text.substr( r + 1 );
				each( err, line, () => {
					incr--;
					if( closed && incr <= 0 && !text.length ) next();
				} );
			}
			next_chunk();
		}, ( err ) => {
			closed = true;
			if( text.length ){
				incr++;
				each( err, text, () => {
					text = '';
					incr--;
					if( closed && incr <= 0 ) next();
				} );
			}
			else {
				if( closed && incr <= 0 ) next();
			}
		} );
	}
	else
		throw new Error( "Bad arguments!" );
}

/**
 * @function write is used to write an entire file, create it or replace it.
 * @param text string
 * @param next function( Error err )
 * @throws Error if ${text} is not a string or ${next} is not a function
 */

function write( text, next ) {
	if( this instanceof File && type.is_string( text ) && type.is_function( next ) )
		fs.writeFile( this.path, text, next );
	else
		throw new Error( "Bad arguments!" );
}

/**
 * @function writeEachLine is used to write in a file each of these lines pushed in third parameter or ${each}
 * @param each function( Error err, function push( String line ) )
 * @param next function( Error err, Number length )
 * @throws Error if ${each} or ${next} is not a function
 */

function writeEachLine( each, next ) {
	if( this instanceof File && type.is_function( each ) && type.is_function( next ) ){
		fs.open( this.path, 'w', ( err, fd ) => {
			if( err ) return next( err, 0 );
			let len = 0,
				fn = ( data ) => {
					if( type.is_string( data ) ){
						fs.write( fd, data + '\n', len, ( err ) => {
							each( err, fn );
						} );
						len += data.length + 1;
					}
					else {
						if( type.is_null( data ) ){
							fs.close( fd, ( err ) => {
								next( err, len );
							} );
						}
						else {
							each( err, fn );
						}
					}
				};
			each( err, fn );
		} );
	}
	else
		throw new Error( "Bad arguments!" );
}

/**
 * @function replaceEachLine is used to replace each line read in the file.
 * @warn For performance settings, this function create a temp file (this.path + '_temp'). Beware there is no existing
 * file with this path.
 * @param each function( Error err, String line, function push( String line ) )
 * @param next function( Error err, Number length )
 * @throws Error if ${each} or ${next} is not a function.
 */

function replaceEachLine( each, next ) {
	if( this instanceof File && type.is_function( each ) && type.is_function( next ) ){
		let path = this.path + '_temp',
			file = this,
			ended = false;
		rename.call( file, path, ( err, temp ) => {
			if( err ) return next( ended = err, 0 );
			let all_read = false,
				cache = [],
				len = 0,
				fn = ( err, push ) => {
					if( ended ) return;
					if( cache.length ){
						each( err, cache.shift(), push );
					}
					else {
						if( all_read )
							next( null, len );
						else
							setTimeout( fn, 0, err, push );
					}
				};
			temp.readEachLine( ( err, line, then ) => {
				if( ended ) return;
				if( err ) return next( ended = err, len );
				if( type.is_string( line ) )
					len += line.length;
				cache.push( line );
				then();
			}, ( err ) => {
				if( err ) return next( ended = err );
				unlink.call( temp, ( err ) => {
					all_read = true;
					if( err ) return next( ended = err, len );
				} );
			} );

			writeEachLine.call( file, fn, ( err ) => { next( ended = err, len )} );
		} );
	}
	else
		throw new Error( "Bad arguments!" );
}

/**
 * @function append is used to write at the end of a file.
 * @param text string
 * @param next function( Error err )
 * @throws Error if ${text} is not a string or ${next} is not a function.
 */

function append( text, next ) {
	if( this instanceof File && type.is_string( text ) && type.is_function( next ) ){
		fs.writeFile( this.path, text, { 'flag': 'a' }, next );
	}
	else
		throw new Error( "Bad arguments!" );
}

/**
 * @function rename move this file to a new path. The new position is sent in ${next} second parameter.
 * @param newPath string
 * @param next function( Error err, File file )
 * @throws Error if ${newPath} is not a string or ${next} is not a function.
 */

function rename( newPath, next ) {
	if( this instanceof File && type.is_string( newPath ) && type.is_function( next ) ){
		fs.rename( this.path, newPath, ( err ) => {
			next( err, File.build( newPath ) );
		} );
	}
	else
		throw new Error( "Bad arguments!" );
}

/**
 * @function unlink delete this file.
 * @param next function( Error err )
 * @throws Error if ${next} is not a function.
 */

function unlink( next ) {
	if( this instanceof File && type.is_function( next ) )
		fs.unlink( this.path, next );
	else
		throw new Error( "Bad arguments!" );
}


//  static method

/**
 * @function build is a static method called to be sure to have only one instance for this file.
 * @param path
 * @returns File
 */

function build( path ) {
	path = pt.normalize( path );
	let file = File.all[ path ];
	if( file instanceof File )
		return file;
	else
		return new File( path );
}

/**
 * @class File is used to write/read a file safely. If an instance is correctly created by File.build static method,
 * this class protect you from errors and your file will not be corrupted. File public methods are used to record a
 * next action to do in this file.
 * ${text} is a string to insert,
 * ${each} is called each line,
 * ${next} is called at the end of the file,
 * ${newPath} is a string to a path.
 */

class File extends Event {

	/**
	 * @warn to ensure there is no error, please use File.build to instanciate a File object.
	 * @param path string
	 */

	constructor( path ) {

		super();
		path = pt.normalize( path );

		this.path = path;
		this.list = [];
		this.sema = null;

		File.all[ path ] = this;
	}

	exists( next ) { // next( bool )
		return add.call( this, exists, [ wrapNext( next, this ) ] );
	}

	read( next ) { // next( err, text )
		return add.call( this, read, [ wrapNext( next, this ) ] );
	}

	readEachLine( each, next ) { // each( err, text ) next( err )
		return add.call( this, readEachLine, [ each, wrapNext( next, this ) ] );
	}

	write( text, next ) { // next( err )
		return add.call( this, write, [ text, wrapNext( next, this ) ] );
	}

	writeEachLine( each, next ) { // each( err, push ) next( err ) push( text )
		return add.call( this, writeEachLine, [ each, wrapNext( next, this ) ] );
	}

	replaceEachLine( each, next ) { // each( err, line, push ) next( err ) push( text )
		return add.call( this, replaceEachLine, [ each, wrapNext( next, this ) ] );
	}

	append( text, next ) { // next( err )
		return add.call( this, append, [ text, wrapNext( next, this ) ] );
	}

	rename( newPath, next ) {
		return add.call( this, rename, [ newPath, wrapNext( next, this ) ] );
	}

	unlink( next ) {
		return add.call( this, unlink, [ wrapNext( next, this ) ] );
	}
}

File.all = {};
File.build = build;

/**
 * File.CHUNK_SIZE is used to set this class chunk size. In my computer, 0x10000 is the power of 2 with best performances.
 * @type number
 */

File.CHUNK_SIZE = 0x10000;

module.exports = File;