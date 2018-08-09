const Content = require( './content' );
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
		this.components = [];
        this.lastContent = null;
	}

	/**
	 * @function addComponent register component constructor in this Page instance
	 * @param obj {Object}
	 * @returns {Page}
	 */

	addComponent( obj ) {
		this.components.push( obj );
		return this;
	}

	/**
	 * @function getContent is the main function called to send the body.
	 * @param req Http.IncomingMessage
	 * @param res Http.ServerResponse
	 * @param next function( Error err, string body )
	 */

	getContent( req, res, next ) {
		let len = this.components.length,
			i = 0,
			self = this;
		if( len ) {
			for( let c in this.components ){
				let constructor = this.components[ c ],
					comp = new constructor();
				comp.getContent( req, res, ( err, body )=>{
					i++;
					if( i >= len ) {
						self.getPage( req, res, ( err, body ) => {
                            self.lastContent = err || body;
                            next( err, body );
                        });
					}
				});
			}
		}
		else {
			self.getPage( req, res, ( err, body ) => {
				self.lastContent = err || body;
				next( err, body );
			});
		}
	}

    /**
     * @method getLastContent stock last content generated and return it.
     * @return string
     */

    getLastContent() {
        return this.lastContent;
    }
}

module.exports = Page;