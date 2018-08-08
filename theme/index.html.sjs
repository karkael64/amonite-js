const HttpCode = require('http-code');

module.exports = function( req, res, next ){ next( null, new HttpCode( 200, `<!DOCTYPE html>
<html>
    <head>
        <meta charset="utf-8"/>
        <title>Test</title>
    </head>
    <body>
        <h1>Test</h1>
        <pre>${req.arguments.get('test')}</pre>
    </body>
</html>` ) ); }