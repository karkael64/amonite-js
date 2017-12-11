const type = require( './types.sjs' );

class Event {
	constructor() {

		Object.defineProperty( this, "__events__", {
			enumerable: false,
			configurable: false,
			writable: false,
			value: {}
		} );
	}

	on( event, fn ) {
		if( type.is_function( fn ) ){
			if( !type.is_list( this.__events__[ event ] ) )
				this.__events__[ event ] = [];
			this.__events__[ event ].push( fn );
		}
		return this;
	}

	detach( event, fn ) {
		if( type.is_list( this.__events__[ event ] ) && type.is_function( fn ) ){
			let res = [], t;
			while( t = this.__events__[ event ].shift() ){
				if( t !== fn )
					res.push( t );
			}
			this.__events__[ event ] = res;
		}
		else {
			this.__events__[ event ] = [];
		}
		return this;
	}

	dispatch( event, args ) {
		if( type.is_list( this.__events__[ event ] ) ){
			for( let fn of this.__events__[ event ] ){
				setTimeout( () => { fn.apply( null, args ); }, 1 );
			}
		}
		return this;
	}

	dispatchSync( event, args ) {
		if( type.is_list( this.__events__[ event ] ) ){
			for( let fn of this.__events__[ event ] ){
				fn.apply( null, args );
			}
		}
		return this;
	}

	count( event ) {
		return type.is_list( this.__events__[ event ] ) ?
			this.__events__[ event ].length :
			null;
	}
}

module.exports = Event;
