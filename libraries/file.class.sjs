const type = require( './types.sjs' );
const fs = require( 'fs' );
const pt = require( 'path' );
const Event = require( './event.class.sjs' );


//  private functions

function add( fn, args ) {
	if( this instanceof File && type.is_function( fn ) && type.is_list( args ) ){
		this.list.push( { "fn": fn, "args": args } );
		next.apply( this );
	}
	else
		throw new Error( "Bad arguments!" );
}

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

function wrapNext( fn, self ) {
	if( self instanceof File && type.is_function( fn ) )
		return ( a, b ) => {
			self.sema = null;
			fn( a, b );
			next.apply( self );
		};
	else
		throw new Error( "Bad arguments!" );
}


//  async calls

function exists( next ) {
	if( this instanceof File && type.is_function( next ) )
		fs.access( this.path, ( err ) => {
			next( !err );
		} );
	else
		throw new Error( "Bad arguments!" );
}

function read( next ) {
	if( this instanceof File && type.is_function( next ) )
		fs.readFile( this.path, next );
	else
		throw new Error( "Bad arguments!" );
}

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
								each( err, bytesRead.slice( 0, bytesRead ), buffer, fn );
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

function write( text, next ) {
	if( this instanceof File && type.is_function( next ) )
		fs.writeFile( this.path, text, next );
	else
		throw new Error( "Bad arguments!" );
}

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

function append( text, next ) {
	if( this instanceof File && type.is_string( text ) && type.is_function( next ) ){
		fs.writeFile( this.path, text, { 'flag': 'a' }, next );
	}
	else
		throw new Error( "Bad arguments!" );
}

function rename( newPath, next ) {
	if( this instanceof File && type.is_string( newPath ) && type.is_function( next ) ){
		fs.rename( this.path, newPath, ( err ) => {
			next( err, File.build( newPath ) );
		} );
	}
	else
		throw new Error( "Bad arguments!" );
}

function unlink( next ) {
	if( this instanceof File && type.is_function( next ) )
		fs.unlink( this.path, next );
	else
		throw new Error( "Bad arguments!" );
}


//  static method

function build( path ) {
	path = pt.normalize( path );
	if( File.all[ path ] instanceof File )
		return file;
	else
		return new File( path );
}

class File extends Event {

	constructor( path ) {

		super();
		path = pt.normalize( path );

		this.path = path;
		this.list = [];
		this.sema = null;

		File.all[ path ] = this;
	}

	exists( next ) { // next( bool )
		add.call( this, exists, [ wrapNext( next, this ) ] );
		return this.list.length;
	}

	read( next ) { // next( err, text )
		add.call( this, read, [ wrapNext( next, this ) ] );
		return this.list.length;
	}

	readEachLine( each, next ) { // each( err, text ) next( err )
		add.call( this, readEachLine, [ each, wrapNext( next, this ) ] );
		return this.list.length;
	}

	write( text, next ) { // next( err )
		add.call( this, write, [ text, wrapNext( next, this ) ] );
		return this.list.length;
	}

	writeEachLine( each, next ) { // each( err, push ) next( err ) push( text )
		add.call( this, writeEachLine, [ each, wrapNext( next, this ) ] );
		return this.list.length;
	}

	replaceEachLine( each, next ) { // each( err, line, push ) next( err ) push( text )
		add.call( this, replaceEachLine, [ each, wrapNext( next, this ) ] );
		return this.list.length;
	}

	append( text, next ) { // next( err )
		add.call( this, append, [ text, wrapNext( next, this ) ] );
		return this.list.length;
	}

	rename( newPath, next ) {
		add.call( this, rename, [ newPath, wrapNext( next, this ) ] );
		return this.list.length;
	}

	unlink( next ) {
		add.call( this, unlink, [ wrapNext( next, this ) ] );
		return this.list.length;
	}
}

File.all = {};
File.build = build;

File.CHUNK_SIZE = 0x10000;

module.exports = File;