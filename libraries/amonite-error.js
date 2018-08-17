const Content = require('./content');

/**
 * @function getMime returns the mime of a file requested by client
 * @param req Http.IncomingMessage
 * @returns string
 */

function getMime( req ) {
    return Content.getFilenameMime( req.file );
}

class AmoniteError extends Content {

    constructor( message, code, previous ) {
        super();
        this.code = code || 500;
        this.message = message || 'No message suited.';
        this.trace = ( new Error() ).stack;
        this.previous = previous || null;

        this.name = "HttpCode";
    }

    /**
     * @function getCode returns the HttpCode code.
     * @returns number
     */

    getCode() {
        return this.code;
    }

    /**
     * @function getMessage returns the body of the HttpCode. The message is also used for the Response body.
     * @returns string
     */

    getMessage() {
        return `${this.name} (${this.getCode()}): ${this.message}`;
    }

    /**
     * @function getTrace is used to return each lines of the stack at the construction of HttpCode.
     * @returns {Array}
     */

    getTrace() {
        let traces = this.trace.split( /\n/ ),
            res = [];
        traces.shift();
        traces.shift();
        traces.forEach( function( trace ){
            res.push( trace.trim() );
        });
        return res;
    }

    /**
     * @function getPrevious returns an Error or a HttpCode created before this one.
     * @returns Error|HttpCode.
     */

    getPrevious() {
        return this.previous;
    }

    /**
     * @function getContentAsText returns this HttpCode in a string formatted as a 'text/plain' mime.
     * @returns {string}
     */

    getContentAsText() {
        let start = `${this.getCode()} - ${this.getTitle()}\n${this.getMessage()}\n`;

        let debug = `${start}${this.getTrace().join('\n')}\n`,
            self = this;
        while( self.getPrevious && ( self = self.getPrevious() ) ) {
            if( self instanceof HttpCode ) {
                debug += `${self.getMessage()}\n`;
                debug += `${self.getTrace().join('\n')}\n`;
            }
            if( self instanceof Error ) {
                debug += `${self.name} (${self.code}): ${self.message}\n`;
                debug += `${self.stack}\n`;
            }
        }
        return debug;
    }

    /**
     * @function getContentAsHTML returns this HttpCode in a string formatted as a 'text/html' mime.
     * @returns {string}
     */

    getContentAsHTML() {
        let start = ( `<h1>${this.getCode()} - ${this.getTitle()}</h1>\n<pre>${this.getMessage()}</pre>\n` ),
            debug = ( `${start}<pre>${this.getTrace().join('\n')}</pre>` ),
            self = this;
        while( self.getPrevious && ( self = self.getPrevious() ) ) {
            if( self instanceof HttpCode ) {
                debug += ( `<pre>${self.getMessage()}</pre>` );
                debug += ( `<pre>${self.getTrace().join('\n')}</pre>` );
            }
            if( self instanceof Error ) {
                debug += ( `<pre>${self.name} (${self.code}): ${self.message}</pre>` );
                debug += ( `<pre>${self.stack}</pre>` );
            }
        }
        return debug;
    }

    /**
     * @function getContentAsJSON returns this HttpCode in an object.
     * @returns object
     */

    getContentAsJSON() {
        let obj = {
            "code": this.getCode(),
            "title": this.getTitle(),
            "message": this.getMessage()
        };
        obj.trace = this.getTrace();
        let self = this, p = self.getPrevious();
        while( p ) {
            if( p instanceof HttpCode ) {
                self.previous = p.getContentAsJSON();
            }
            if( p instanceof Error ) {
                self.previous = {
                    "code": p.code,
                    "message": p.message,
                    "trace": p.stack
                };
            }
            self = p;
            p = self.getPrevious();
        }
        return obj;
    }

    /**
     * @function getContent returns HttpCode in a string in the format in the file requested.
     * @param req Http.IncomingMessage
     * @param res Http.ServerResponse
     * @param next function( Error err, string body )
     * @returns string
     */

    getContent( req, res, next ) {
        let mime = getMime( req );
        if( mime === 'text/html' )
            return next( null, this.getContentAsHTML() );
        if( mime === 'application/json' )
            return next( null, JSON.stringify( this.getContentAsJSON(), null, 4 ) );
        return next( null, this.getContentAsText() );
    }

    toString() {
        return "[object AmoniteError]";
    }
}

module.exports = AmoniteError;
