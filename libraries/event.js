const HttpCode = require( 'http-code' );
const Error = HttpCode.prototype.__proto__.constructor;

const type = require( 'types' );
const EventTarget = require( './event-target' );

class Event {

    constructor( name_or_previous_event, options_or_target, currentTarget, originalTarget ) {

        if( type.is_string( name_or_previous_event ) ) {

            let name = name_or_previous_event,
                options = options_or_target;

            this.type = name;

            if( originalTarget && originalTarget instanceof EventTarget ) {
                Object.defineProperty( this, 'originalTarget', {'configurable':false,'value':originalTarget} );
                Object.defineProperty( this, 'target',         {'configurable':false,'value':originalTarget} );
            }
            if( currentTarget && currentTarget instanceof EventTarget ) {
                Object.defineProperty( this, 'currentTarget',  {'configurable':false,'value':currentTarget} );
            }

            if( type.is_object( options ) )
                this.options = options;

            Object.defineProperty( this, 'timeStamp', {'configurable':false,'value':Date.now()} );

        }
        else if( name_or_previous_event instanceof Event && options_or_target instanceof EventTarget ){

            let previous = name_or_previous_event,
                target = options_or_target;

            this.type = name_or_previous_event.type;

            if( originalTarget && originalTarget instanceof EventTarget ) {
                Object.defineProperty( this, 'originalTarget', {'configurable':false,'value':previous.originalTarget} );
                Object.defineProperty( this, 'target',         {'configurable':false,'value':previous.originalTarget} );
            }
            if( currentTarget && currentTarget instanceof EventTarget ) {
                Object.defineProperty( this, 'currentTarget',  {'configurable':false,'value':target} );
            }

            if( type.is_object( options_or_target ) )
                this.options = Object.create( name_or_previous_event.options );

            Object.defineProperty( this, 'timeStamp', {'configurable':false,'value':previous.timeStamp} );
        }
        else {

            throw new Error( "Bad arguments" );
        }
    }
}

module.exports = Event;