const HttpCode = require( 'http-code' );
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
				<li v-for="link in links"><a v-bind:href="link.href">{{link.text}}</a></li>
			</ul>
		</nav>
	`);

/*
		return next( null, `
		<nav>
			<ul>
				<li><a href="/">Accueil</a></li>
				<li><a href="/infos.html">Informations</a></li>
				<li><a href="/contacts.html">Contacts</a></li>
			</ul>
		</nav>
	` );
*/		
	}
}

module.exports = NavComponent;