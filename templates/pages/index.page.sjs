const HttpCode = require( 'http-code' );
const Page = require( '../../libraries/page.js' );
const NavComponent = require( '../components/navigation.component.sjs' );

class IndexPage extends Page {

	constructor() {
		super();
		this.addComponent( NavComponent );
	}

	getPage( req, res, next ) {

		let navBody = this.getComponentBody( NavComponent );

		return next( null, `<!doctype html>
<html>
<head>
<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0">
	<meta http-equiv="X-UA-Compatible" content="ie=edge">
	<title>Document</title>
	<script src="/scripts/common.js"></script>
	<script src="/scripts/vue.js"></script>
</head>
<body>
	<h1>Hello World!</h1>
	${navBody}
	<script src="/scripts/run-vue.js"></script>
</body>
</html>`
		);
	}
}

module.exports = IndexPage;