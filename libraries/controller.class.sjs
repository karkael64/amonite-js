let type = require( './types.sjs' );

class Controller {

	constructor( condition, launch ) {

		this.condition = condition;
		this.launch = launch;
	}

	getPriority( args_where ) {
		if( type.is_function( this.condition ) )
			return this.condition.apply( args_where );

		if( type.is_number( this.condition ) || type.is_boolean( this.condition ) || type.is_string( this.condition ) )
			return this.condition;
	}

	execute( args ) {
		if( type.is_function( this.launch ) )
			return this.launch.apply( args );
	}
}

Controller.list = [];
Controller.register = ( controller ) => {
	if( controller instanceof Controller )
		return this.list.push( controller );
	return false;
};

Controller.getHigherPriority = ( args_where ) => {
	let max = 0,
		selected = null,
		t;
	Controller.list.forEach( ( controller ) => {
		if( controller instanceof Controller && ( ( t = controller.getPriority( args_where ) ) > max ) ){
			max = t;
			selected = controller;
		}
	} );
	return selected;
};

Controller.executeHigherPriority = ( args_where, args ) => {
	if( !type.is_object( args ) && type.is_object( args_where ) )
		args = args_where;

	let controller = Controller.getHigherPriority( args_where );
	if( controller instanceof Controller ){
		return controller.execute( args );
	}
	else {
		throw new HttpCode( 500, 'No controller found.' );
	}
};


Controller.simpleFileController = new Controller( ( req, res ) => {

}, ( req, res ) => {

} );


module.exports = Controller;