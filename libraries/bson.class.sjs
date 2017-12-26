const type = require( './types.sjs' );
const File = require( './file.class.sjs' );

/**
 * @class BSON is a class for reading/writing files in BSON format, with NoSQL methods.
 */

class BSON {


	//  row functions

	/**
	 * @method constructor is used to instanciate a row of a collection saved in BSON.
	 * @param id_or_data number|object|null|undefined
	 * @param next function( Error err )|undefined
	 */

	constructor( id_or_data, next ) {

		this.file = File.build( BSON.FOLDER + this.constructor.name + '.bson' );
		this.sync_date = null;

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
			next();
		}
	}

	/**
	 * @method load is used to get informations associated with its id, then call ${next} as callback.
	 * @param next function( Error err )
	 * @throws Error if next is not a function or this object hasn't an id yet.
	 */

	load( next ) {
		let id = this.data.id,
			self = this,
			done = false;
		if( type.is_function( next ) && type.is_number( id )) {
			this.file.readEachLine( ( err, line, then ) =>{
				if( err ) return next( err );
				if( !done ) {
					let data = JSON.parse( line );
					if( data.id === id ) {
						self.sync_date = Date.now();
						done = true;
						self.data = data;
					}
				}
				then();
			})
		}
		else
			throw new Error( "Bad arguments!" );
	}

	/**
	 * @method save is used to set informations, then call ${next} as a callback.
	 * @param next function( Error err )
	 * @throws Error if next is not a function.
	 */

	save( next ) {
		if( type.is_function( next ) ) {
			let s = this,
				self = s.data;
			if( this.data.id ) {
				this.update( ( data, push )=>{
					if( data.id === self.id ) {
						self.sync_date = Date.now();
						push( self );
					}
					else
						push();
				}, next );
			}
			else {
				this.nextId( ( err, id )=>{
					if( err ) return next( err );
					self.id = id;
					s.insert( self, ( err )=>{
						self.sync_date = Date.now();
						next( err );
					});
				});
			}
		}
		else
			throw new Error( "Bad arguments!" );
	}

	/**
	 * @method get is used to get current row field value, or send undefined if not found.
	 * @param name
	 * @returns {*}
	 */

	get( name ) {
		return this.data[ name ];
	}

	/**
	 * @method set is used to set row field value.
	 * @param name
	 * @param value
	 * @returns {BSON}
	 */

	set( name, value ) {
		this.data[ name ] = value;
		return this;
	}


	//  collection functions

	/**
	 * @method select is used to seek each rows, and then use next as a callback.
	 * @param each function( Error err, Object data, Function then )
	 * @param next function()
	 * @throws Error if ${each} or ${next} is not a function
	 */

	select( each, next ) {

		if( type.is_function( each ) && type.is_function( next ) ){
			this.file.readEachLine( ( err, line, then ) => {
				each( err, JSON.parse( line ), then );
			}, next );
		}
		else
			throw new Error( "Bad arguments!" );
	}

	/**
	 * @method update is used to seek each rows and set them in third parameter of ${each} function
	 * @param each function( Error err, Object data, Function push )
	 * @param next function( Error err, Number len )
	 * @throws Error if ${each} or ${next} is not a function
	 */

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

	/**
	 * @method insert is used to append a row with ${data}, then call ${next} as a callback.
	 * @param data Object
	 * @param next function( Error err )
	 * @throws Error if ${data} is undefined or ${next} is not a function.
	 */

	insert( data, next ) {
		if( !type.is_undefined( data ) && type.is_function( next ) ) {
			this.file.append( JSON.stringify( data ) + '\n', next );
		}
		else
			throw new Error( "Bad arguments!" );
	}

	/**
	 * @method nextId is used to get next unique id in these rows.
	 * @param next function( Error err, Number id )
	 * @throws Error if ${next} is not a function
	 */

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