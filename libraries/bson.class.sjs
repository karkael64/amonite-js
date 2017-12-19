const type = require( './types.sjs' );
const File = require( './file.class.sjs' );

class BSON {


	//  row functions

	constructor( id_or_data, next ) {

		this.file = File.build( BSON.FOLDER + this.constructor.name + '.bson' );

		if( type.is_number( id_or_data ) ) {
			this.data = {"id":id_or_data};
			if( type.is_function( next ) )
				this.load( next );
		}
		else {
			if( type.is_object( id_or_data ) )
				this.data = id_or_data;
			else
				this.data = {};
		}
	}

	load( next ) {
		let id = this.data.id,
			self = this,
			done = false;
		if( type.is_function( next ) && type.is_number( id )) {
			this.file.readEachLine( ( err, line, then ) =>{
				if( err ) return next( err );
				if( !done ) {
					let data = JSON.parse( line );
					if( data.id === id )
						self.data = data;
				}
				then();
			})
		}
		else
			throw new Error( "Bad arguments!" );
	}

	save( next ) {
		if( type.is_function( next ) ) {
			let s = this,
				self = s.data;
			if( this.data.id ) {
				this.update( ( data, push )=>{
					push( ( data.id === self.id ) ? self : undefined );
				}, next );
			}
			else {
				this.nextId( ( err, id )=>{
					if( err ) return next( err );
					self.id = id;
					s.insert( self, next );
				});
			}
		}
		else
			throw new Error( "Bad arguments!" );
	}

	get( name ) {
		return this.data[ name ];
	}

	set( name, value ) {
		this.data[ name ] = value;
		return this;
	}


	//  collection functions

	select( each, next ) {

		if( type.is_function( each ) && type.is_function( next ) ){
			this.file.readEachLine( ( err, line, then ) => {
				each( err, JSON.parse( line ), then );
			}, next );
		}
		else
			throw new Error( "Bad arguments!" );
	}

	update( each, next ) {
		if( type.is_function( each ) && type.is_function( next ) ){
			this.file.replaceEachLine( ( err, line, push ) => {
				each( err, JSON.parse( line ), ( data )=>{
					if( data === BSON.UPDATE_REMOVE )
						return push( undefined );
					if( data === BSON.UPDATE_IGNORE )
						return push( line );

					return push( JSON.stringify( data ) );
				})
			}, next );
		}
		else
			throw new Error( "Bad arguments!" );
	}

	insert( data, next ) {
		if( !type.is_undefined( data ) && type.is_function( next ) ) {
			this.file.append( JSON.stringify( data ) + '\n', next );
		}
		else
			throw new Error( "Bad arguments!" );
	}

	nextId( next ) {
		if( type.is_function( next ) ) {
			let max = 1;
			this.file.readEachLine( ( err, line, then ) => {
				try {
					let data = JSON.parse( line );
					if( data.id >= max )
						max = data.id + 1;
					then();
				}
				catch( err ) {
					next( err );
				}
			}, ()=>{
				next( null, max );
			} );
		}
		else
			throw new Error( "Bad arguments!" );
	}
}

BSON.FOLDER = './data/';
BSON.UPDATE_REMOVE = undefined;
BSON.UPDATE_IGNORE = null;

module.exports = BSON;