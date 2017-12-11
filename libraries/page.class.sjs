const Content = require( './content.class.sjs' );
const type = require( './types.sjs' );

class Page extends Content {

	constructor() {
		super();
		if( !type.is_function( this.getPage ) )
			throw new Error( "This instance of Component has no getPage function!" );
		this.components = {};
		this.length = 0;
	}

	addComponent( constructor ) {
		this.components[ constructor.name ] = constructor;
		this.length++;
		return this;
	}

	getComponentBody( constructor ) {
		return this.components[ constructor.name ].body;
	}

	countComponents() {
		let i = 0;
		for( let c in this.components ) i++;
		return i;
	}

	getContent( req, res, success, failure ) {
		let len = this.countComponents(),
			i = 0,
			self = this;
		if( len ) {
			for( let c in this.components ){
				let constructor = this.components[ c ],
					comp = new constructor();
				comp.getContent( req, res, ( body )=>{
					constructor.body = body;
					i++;
					if( i >= len ) {
						self.getPage( req, res, success, failure );
					}
				}, failure );
			}
		}
		else {
			self.getPage( req, res, success, failure );
		}
	}
}

module.exports = Page;