const HttpCode = require( 'http-code' );
const Error = HttpCode.prototype.__proto__.constructor;
const Content = Error.prototype.__proto__.constructor;

const type = require( 'types' );


/**
 * @method getIntoContent is a required function which returns this.getComponent of child class.
 * @param req Http.IncomingMessage
 * @param res Http.ServerResponse
 * @param next function( Error err, String content )
 */

function getIntoContent( req, res, next ) {

    let name = this.constructor.name,
        self = this;

    if( type.is_function( this.onCall ) && ( req.arguments.get( 'component' ) === name ) ) {
        this.onCall( req, res, ()=>{
            self.getComponent( req, res, ( err, body )=>{
                let etag = Content.bodyEtag( body ),
                    content = `<div component="${name}" etag="${etag}">${body}</div>`;
                this.lastContent = err || content;
                return next( err, content );
            });
        });
    }
    else {
        this.getComponent( req, res, ( err, body )=>{
            let etag = Content.bodyEtag( body ),
                content = `<div component="${name}" etag="${etag}">${body}</div>`;
            this.lastContent = err || content;
            return next( err, content );
        });
    }
}


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

        if( !type.is_function( next ) ) {
            if( this.lastContent ) {
                throw new Error( "Third parameter should be a String. " +
                    "Otherwise, content is already set, please use getLastContent() instead of getContent().", 2 );
            }
            else {
                throw new Error( "Third parameter should be a String.", 1 );
            }
        }

        let len = this.components.length,
            i = 0,
            self = this;
        if( len ) {
            for( let comp in this.components ){
                comp.getContent( req, res, ()=>{
                    i++;
                    if( i >= len ) {
                        getIntoContent.call( self, req, res, next );
                    }
                });
            }
        }
        else {
            getIntoContent.call( self, req, res, next );
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