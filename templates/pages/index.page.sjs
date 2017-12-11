const HttpCode = require( '../../libraries/http-code.class.sjs' );
const Page = require( '../../libraries/page.class.sjs' );
const NavComponent = require( '../components/navigation.component.sjs' );

class IndexPage extends Page {

	constructor() {
		super();

		this.addComponent( NavComponent );
	}

	getPage( req, res, success, failure ) {

		let navBody = this.getComponentBody( NavComponent );

		return success( `<!doctype html>
<html>
<head>
<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0">
 	<meta http-equiv="X-UA-Compatible" content="ie=edge">
 	<title>Document</title>
</head>
<body>
	<h1>Hello World!</h1>
	${navBody}
</body>
</html>`
		);
	}
}

module.exports = IndexPage;