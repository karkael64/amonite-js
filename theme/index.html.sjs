const HttpCode = require('http-code');
const Page = require('../libraries/motor.js').Page;

class ClassicPage extends Page {
    getPage( req, res, next ) {
        next( null, new HttpCode( 200, `<!DOCTYPE html>
<html>
    <head>
        <meta charset="utf-8"/>
        <title>Test</title>
    </head>
    <body>
        <h1>Test</h1>
        <pre>${req.arguments.get('test')}</pre>
    </body>
</html>` ) );
    }
}

module.exports = new ClassicPage();