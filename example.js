const hostname = '127.0.0.1';
const port = 8000;

/*
const fs = require( 'fs' );
const https_options = {
    key: fs.readFileSync( './https/key.pem' ),
    cert: fs.readFileSync( './https/cert.pem' )
};
*/

const Amonite = require( './libraries/motor' );

/*
const path = require('path')
Amonite.logFile = path.normalize( __dirname + '/log.bson' );
Amonite.publicPath = path.normalize( __dirname + '/theme' ) + '/';
*/

let a = new Amonite;
a.reviveHttp( hostname, port, true );
