const HttpCode = require( '../libraries/http-code.class.sjs' );
const IndexPage = require( '../templates/pages/index.page.sjs' );

HttpCode.DEBUG_MODE = true;

module.exports = new IndexPage();
