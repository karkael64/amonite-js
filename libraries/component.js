const Content = require( './content' );
const type = require( 'types' );

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
	 * @warn this class can't be instanciated as if, a child class should have getComponent as method.
	 */

	constructor() {
		super();
		if( !type.is_function( this.getComponent ) )
			throw new Error( "This instance of Component has no getComponent function!" );
        this.components = [];
		this.lastContent = null;
	}

    /**
     * @function addComponent register component constructor in this Page instance
     * @param obj {Object}
     * @returns {Component}
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
                comp.getContent( req, res, ()=>{
                    i++;
                    if( i >= len ) {
                        self.getIntoContent( req, res, next );
                    }
                });
            }
        }
        else {
            self.getIntoContent( req, res, next );
        }
    }



    /**
     * @method getIntoContent is a required function which returns this.getComponent of child class.
     * @param req Http.IncomingMessage
     * @param res Http.ServerResponse
     * @param next function( Error err, String content )
     */

    getIntoContent( req, res, next ) {

        let name = this.constructor.name,
            self = this;

        if( type.is_function( this.onCall ) && ( req.arguments.get( 'component' ) === name ) ) {
            this.onCall( req, res, ()=>{
                self.getComponent( req, res, ( err, body )=>{
                    let etag = Content.bodyEtag( body ),
                        content = `<div component="${name}" etag="${etag}">${body}</div>`;
                    this.lastContent = err || content;
                    return next( err, content );
                }, next );
            }, next );
        }
        else {
            this.getComponent( req, res, ( err, body )=>{
                let etag = Content.bodyEtag( body ),
                    content = `<div component="${name}" etag="${etag}">${body}</div>`;
                this.lastContent = err || content;
                return next( err, content );
            }, next );
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

module.exports = Component;