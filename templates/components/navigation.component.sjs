const HttpCode = require( '../../libraries/http-code.class.sjs' );
const Component = require( '../../libraries/component.class.sjs' );

class NavComponent extends Component {

	onCall( req, res, next ) {
		next();
	}

	getComponent( req, res, next ) {
		return next( null, `
		<nav>
			<ul>
				<li>Accueil</li>
				<li>Informations</li>
				<li>Contacts</li>
			</ul>
		</nav>
	` );
	}
}

module.exports = NavComponent;