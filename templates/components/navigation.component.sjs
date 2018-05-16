const HttpCode = require( '../../libraries/http-code.class.sjs' );
const Component = require( '../../libraries/component.class.sjs' );

class NavComponent extends Component {

	onCall( req, res, next ) {
		throw new HttpCode( 403 );
		next();
	}

	getComponent( req, res, next ) {

		return next( null, `
		<nav>
			<ul>
				<li><a href="/">Accueil</a></li>
				<li><a href="/infos.html">Informations</a></li>
				<li><a href="/contacts.html">Contacts</a></li>
			</ul>
		</nav>
	` );
		
	}
}

module.exports = NavComponent;