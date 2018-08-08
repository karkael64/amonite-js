const Content = require( './content.class.sjs' );
const type = require( 'types' );

/**
 * @class Page is used to create easy Component wrapper, often HTML items. For example, you can add components in your
 * Page instance and when you call getContent, the getPage has all its components next to it. Beware : components are
 * called and build before your Page.
 */

class Page extends Content {

	/**
	 * @warn this class can't be instanciated as if, a child class should have getPage as method.
	 */

	constructor() {
		super();
		if( !type.is_function( this.getPage ) )
			throw new Error( "This instance of Component has no getPage function!" );
		this.components = {};
		this.bodies = {};
		this.length = 0;
	}

	/**
	 * @function addComponent register component constructor in this Page instance
	 * @param constructor function()
	 * @returns {Page}
	 */

	addComponent( constructor ) {
		this.components[ constructor.name ] = constructor;
		this.length++;
		return this;
	}

	/**
	 * @function getComponentBody get the content of the component.
	 * @param constructor function()
	 * @returns {HTMLElement|*}
	 */

	getComponentBody( constructor ) {
		return this.bodies[ constructor.name ];
	}

	/**
	 * @function countComponents returns the count of components.
	 * @returns {number}
	 */

	countComponents() {
		let i = 0;
		for( let c in this.components ) i++;
		return i;
	}

	/**
	 * @function getContent is the main function called to send the body.
	 * @param req Http.IncomingMessage
	 * @param res Http.ServerResponse
	 * @param next function( Error err, string body )
	 */

	getContent( req, res, next ) {
		let len = this.countComponents(),
			i = 0,
			self = this;
		if( len ) {
			for( let c in this.components ){
				let constructor = this.components[ c ],
					comp = new constructor();
				comp.getContent( req, res, ( err, body )=>{
					this.bodies[ comp.constructor.name ] = body;
					i++;
					if( i >= len ) {
						self.getPage( req, res, next );
					}
				});
			}
		}
		else {
			self.getPage( req, res, next );
		}
	}
}

module.exports = Page;