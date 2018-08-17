const type = require( 'types' );
const Event = require( './event' );

/**
 * @class EventTarget allows you to use the event paradigm, synchronous and asynchronous.
 */

class EventTarget {

	constructor() {

		Object.defineProperty( this, "__events__", {
			enumerable: false,
			configurable: false,
			writable: false,
			value: {}
		});
	}

	/**
	 * @function on is used to record a function ${fn} to call when ${event} is dispatched.
	 * @param event string|array
	 * @param fn function|array
	 * @returns {EventTarget}
	 */

	on( event, fn ) {
        event = event.toLowerCase();
        if( type.is_string( event ) ) {
            let split = event.split( /[, ]+/ );
            if( split >= 2 ) {
                EventTarget.prototype.on.call( this, split, fn );
                return this;
            }
        }
        if( type.is_list( event ) ) {
            for( let ev of event )
                EventTarget.prototype.on.call( this, ev, fn );
            return this;
        }
        if( type.is_list( fn ) ) {
            for( let f of fn )
                EventTarget.prototype.on.call( this, event, f );
            return this;
        }

		if( type.is_string( event ) && type.is_function( fn ) ){
            if( !type.is_list( this.__events__[ event ] ) )
                this.__events__[ event ] = [];
            this.__events__[ event ].push( fn );
            return this;
        }
		return this;
	}

	/**
	 * @function detach is used to revoke a function ${fn} or every functions if undefined, to call $when ${event} is
	 * dispatched.
	 * @param event string|array
	 * @param fn function|array|undefined
	 * @returns {EventTarget}
	 */

	detach( event, fn ) {

		if( type.is_string( event ) ) {
            event = event.toLowerCase();
            let split = event.split( /[, ]+/ );
            if( split >= 2 ) {
                EventTarget.prototype.detach.call( this, split, fn );
                return this;
            }
		}
        if( type.is_list( event ) ) {
            for( let ev of event )
                EventTarget.prototype.detach.call( this, ev, fn );
            return this;
        }
        if( type.is_list( fn ) ) {
            for( let f of fn )
                EventTarget.prototype.detach.call( this, event, f );
            return this;
        }

		if( type.is_string( event ) && type.is_list( this.__events__[ event ] ) ) {
			if( type.is_function( fn ) ){
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
        }
		return this;
	}

	/**
	 * @function dispatch is used to call every functions of ${event} asynchronously after a short timeout, with
	 * arguments ${arg}.
	 * @param event Event|string|array
	 * @param args list|array|undefined
	 * @returns {EventTarget}
	 */

	dispatch( event, args ) {

        if( type.is_string( event ) ) {
            event = event.toLowerCase();
            let split = event.split( /[, ]+/ );
            if( split >= 2 ) {
                EventTarget.prototype.dispatch.call( this, split, args );
                return this;
            }
        }
        if( type.is_list( event ) ) {
            for( let ev of event )
                EventTarget.prototype.dispatch.call( this, ev, args );
            return this;
        }

        let obj;
        if( event instanceof Event )
            obj = new Event( event, this );
        else if( type.is_string( event ) )
            obj = new Event( event );
        else
            obj = new Event( "" );

        if( type.is_list( this.__events__[ event ] ) ){

            if( !type.is_list( args ) ) {
                if( type.is_undefined( args ) ) args = [];
                else args = [args];
            }
            args.unshift( obj );

			for( let fn of this.__events__[ event ] ){
				setTimeout( () => { fn.apply( null, args ); }, 1 );
			}
		}
		return this;
	}

	/**
	 * @function dispatch is used to call every functions of ${event} synchronously, with arguments ${arg}.
	 * @param event string|array
	 * @param args list|array|undefined
	 * @returns {EventTarget}
	 */

	dispatchSync( event, args ) {

        if( type.is_string( event ) ) {
            event = event.toLowerCase();
            let split = event.split( /[, ]+/ );
            if( split >= 2 ) {
                EventTarget.prototype.dispatchSync.call( this, split, args );
                return this;
            }
        }
        if( type.is_list( event ) ) {
            for( let ev of event )
                EventTarget.prototype.dispatchSync.call( this, ev, args );
            return this;
        }

        let obj;
        if( event instanceof Event )
            obj = new Event( event, this );
        else if( type.is_string( event ) )
            obj = new Event( event );
        else
            obj = new Event( "" );

		if( type.is_list( this.__events__[ event ] ) ){

            if( !type.is_list( args ) ) {
                if( type.is_undefined( args ) ) args = [];
                else args = [args];
            }
            args.unshift( obj );

			for( let fn of this.__events__[ event ] ){
				fn.apply( null, args );
			}
		}
		return this;
	}

	/**
	 * @function count recorded functions of an event ${event} name.
	 * @param event string
	 * @returns null|number
	 */

	count( event ) {
		return type.is_string( event ) && type.is_list( this.__events__[ event ] ) ?
			this.__events__[ event ].length :
			null;
	}
}

module.exports = EventTarget;
