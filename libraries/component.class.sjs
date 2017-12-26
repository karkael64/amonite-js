const Content = require( './content.class.sjs' );
const type = require( './types.sjs' );

/**
 * @class Component is used to create easy exportable items, often HTML items. For example, onCall is a method called
 * if component is called in this context, if it exists and if this component name is in request arguments. Then method
 * getComponent is called to get the body of this component.
 *
 * function onCall( Http.IncomingMessage req, Http.ServerResponse res, function next() )
 * function getComponent( Http.IncomingMessage req, Http.ServerResponse res, function next( Error err, String body ) )
 */

class Component extends Content {

	/**
	 * @warn this call can't be instanciated as if, a child class should have getComponent as method.
	 */

	constructor() {
		super();
		if( !type.is_function( this.getComponent ) )
			throw new Error( "This instance of Component has no getComponent function!" );
	}

	/**
	 * @method getContent is a required function which returns this.getComponent of child class.
	 * @param req Http.IncomingMessage
	 * @param res Http.ServerResponse
	 * @param next function( Error err, String content )
	 */

	getContent( req, res, next ) {

		let name = this.constructor.name,
			self = this;

		if( type.is_function( this.onCall ) && ( req.arguments.get( 'component' ) === name ) ) {
			this.onCall( req, res, ()=>{
				self.getComponent( req, res, ( err, body )=>{
					let etag = Content.bodyEtag( body );
					return next( null, `<div component="${name}" etag="${etag}">${body}</div>` );
				}, next );
			}, next );
		}
		else {
			this.getComponent( req, res, ( err, body )=>{
				let etag = Content.bodyEtag( body );
				return next( null, `<div component="${name}" etag="${etag}">${body}</div>` );
			}, next );
		}
	}
}

module.exports = Component;