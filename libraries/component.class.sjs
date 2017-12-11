const Content = require( './content.class.sjs' );
const type = require( './types.sjs' );

class Component extends Content {

	constructor() {
		super();
		if( !type.is_function( this.getComponent ) )
			throw new Error( "This instance of Component has no getComponent function!" );
	}

	getContent( req, res, success, failure ) {

		let name = this.constructor.name,
			self = this;

		if( type.is_function( this.onCall ) && ( req.arguments.get( 'component' ) === name ) ) {
			this.onCall( req, res, ()=>{
				self.getComponent( req, res, ( body )=>{
					let etag = Content.bodyEtag( body );
					return success( `<div component="${name}" etag="${etag}">${body}</div>` );
				}, failure );
			}, failure );
		}
		else {
			this.getComponent( req, res, ( body )=>{
				let etag = Content.bodyEtag( body );
				return success( `<div component="${name}" etag="${etag}">${body}</div>` );
			}, failure );
		}
	}
}

module.exports = Component;