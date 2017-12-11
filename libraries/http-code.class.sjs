const Content = require( './content.class.sjs' );

function getMime( req ) {
	return Content.getFilenameMime( req.file );
}

const httpCode = {
	200: {
		"title": "OK",
		"message": "Hello World!"
	},
	204: {
		"title": "No Content",
		"message": "This file has no content and can't be displayed."
	},
	304: {
		"title": "Not Modified",
		"message": "This file is not modified since your last request."
	},
	307: {
		"title": "Temporary Redirect",
		"message": "The server redirected page to another link."
	},
	308: {
		"title": "Permanent Redirect",
		"message": "The server redirected page to another link."
	},
	400: {
		"title": "Bad Request",
		"message": "The server cannot or will not process request due to an apparent request error."
	},
	403: {
		"title": "Forbidden",
		"message": "The user does not have the necessary permissions for the resource."
	},
	404: {
		"title": "Not Found",
		"message": "The resource is not reachable or does not exists."
	},
	418: {
		"title": "I'm a Teapot",
		"message": "You can brew me, I'm hot !"
	},
	500: {
		"title": "Internal Server Error",
		"message": "An unexpected condition was encountered and no specific message is suitable. Please try again or contact administrator."
	},
	503: {
		"title": "Service Unavailable",
		"message": "The server HTTP is currently unavailable. Please try again or contact administrator."
	},
	"debug": {
		"title": "500 Debug",
		"message": "No trace!"
	},
	"default": {
		"title": "Unknown Error",
		"message": "An unknown error was encountered and no specific message is suitable."
	}
};


class HttpCode extends Content {

	constructor( code, message, previous ) {
		super();
		this.code = code || 500;
		this.message = message || 'No message suited.';
		this.trace = ( new Error() ).stack;
		this.previous = previous || null;

		this.name = "HttpCode";
	}

	getCode() {
		return this.code;
	}

	getTitle() {
		return ( httpCode[ this.code ] || httpCode[ "default" ] ).title;
	}

	getMessage() {
		if( HttpCode.DEBUG_MODE )
			return `${this.name} (${this.code}): ${this.message}`;
		else
			return ( httpCode[ this.code ] || httpCode[ "default" ] ).message;
	}

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

	getPrevious() {
		return this.previous;
	}

	getContentAsText() {
		let start = `${this.getCode()} - ${this.getTitle()}\n${this.getMessage()}\n`;

		if( HttpCode.DEBUG_MODE ) {
			let debug = `${start}${this.getTrace().join('\n')}\n`,
				self = this;
			while( self = self.previous ) {
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
		else {
			return start;
		}
	}

	getContentAsHTML() {
		if( HttpCode.DEBUG_MODE ) {
			let start = ( `<h1>${this.getCode()} - ${this.getTitle()}</h1>\n<pre>${this.getMessage()}</pre>\n` ),
				debug = ( `${start}<pre>${this.getTrace().join('\n')}</pre>` ),
				self = this;
			while( self = self.previous ) {
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
		else {
			return ( `<h1>${this.getCode()} - ${this.getTitle()}</h1>\n<p>${this.getMessage()}</p>\n` );
		}
	}

	getContentAsJSON() {
		let obj = {
			"code": this.getCode(),
			"title": this.getTitle(),
			"message": this.getMessage()
		};
		if( HttpCode.DEBUG_MODE ) {
			obj.trace = this.getTrace();
			let self = this, p = self.previous;
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
				p = self.previous;
			}
		}
		return obj;
	}

	getContent( req ) {
		let mime = getMime( req );
		if( mime === 'text/html' )
			return this.getContentAsHTML();
		if( mime === 'text/plain' )
			return this.getContentAsText();
		if( mime === 'application/json' )
			return JSON.stringify( this.getContentAsJSON(), true, 4 );
	}

	toString() {
		return "[object HttpCode]";
	}
}

HttpCode.DEBUG_MODE = false;
HttpCode.READ_PREVIOUS = false;

module.exports = HttpCode;