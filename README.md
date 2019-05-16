# Amonite 
 Amonite is composed with a web client-side ([JS](https://github.com/karkael64/amonite-front)) and server-side ([PHP](https://github.com/karkael64/amonite-php) and NodeJS) engine. It is an engine that complies with HTTP standards, lightweight, easy to use. It's an engine that lets you decide how the program should go forward.

## Amonite-JS
 Amonite is a good NodeJS engine :
 - with torque Request / Controller, 
 - with Document / Component couple and 
 - with Throwable / Answerable response easy to use.

### Why would you use Amonite-JS
 Power Up!
 1. Easy paradigm, 
 2. Soft framework, 
 3. Easy installation, 
 4. Follow HTTP Standards.

 Pacify the Workspace!
 5. Two-way document sending (not thousands): a document or an error, 
 6. Easy manage your endpoints with files in a directory (here called THEME), where the path match the url, 
 7. Easy simple file sending (with no file processing), 
 8. Easy data processing entry (by calling a file ending with ".sjs" extension), 
 9. You can easy `throw new HttpCode(403)` (for example) anywhere in your code.

### Why would you NOT use Amonite-JS
 1. You need heavy control system, 
 3. You don't trust your colleagues or craftmanship and
 2. Expensive tools are most qualitative.

## Start with Amonite-JS
 May be you would like use it with default config. Then just call it like : 
 ```
const hostname = '127.0.0.1';
const port = 8000;

const Amonite = require( './libraries/motor' );

let a = new Amonite;
a.reviveHttp( hostname, port, true );
 ```

 [What does default config do ?](how_it_works.md#amonite-js-particularly)
 
### Use with secured HTTPS
  ```
const hostname = '127.0.0.1';
const port = 8000;

const fs = require( 'fs' );
const https_options = {
    key: fs.readFileSync( './https/key.pem' ),
    cert: fs.readFileSync( './https/cert.pem' )
};

const Amonite = require( './libraries/motor' );

let a = new Amonite;
a.reviveHttps( hostname, port, https_options, true );
 ```
 
### Define the files folder
  ```
const hostname = '127.0.0.1';
const port = 8000;

const Amonite = require( './libraries/motor' );

const path = require('path')
Amonite.logFile = path.resolve( __dirname + '/log.bson' );
Amonite.publicPath = path.resolve( __dirname + '/THEME' ) + '/';

let a = new Amonite;
a.reviveHttp( hostname, port, true );
 ```

## Enhance Amonite-JS
 Amonite default config uses HttpCode, Content, Page and Component.
 
### Answerable file : Page / Component model
 You can enhance the engine with Page / Component classes or you can create any class that extends `Content` class. In example :
 
__File : /templates/pages/IndexPage.js__
 ```
const Page = require('../../libraries/page')
const NavComponent = require('../components/NavComponent.js')

class IndexPage extends Page {
  constructor () {
    this.addComponent(this.$nav = new NavComponent))
  }
  
  getPage (req, res, then) {
    then (null, `<!doctype html><html>
    <head>
    </head>
    <body>
        ${this.$nav.getLastContent()}
    </body></html>`)
  }
}

module.exports = IndexPage

 ```
 
__File : /templates/components/NavComponent.js__
 ```
 const Component = require('../../libraries/component')
 
 class NavComponent extends Component {
 
     getComponent (req, res, then) {
         then(null, `<nav>
            <ul>
                <li>
                    <a href="#a">A</a>
                </li>
                <li>
                    <a href="#b">B</a>
                </li>
                <li>
                    <a href="#c">C</a>
                </li>
            </ul>
        </nav>`)
     }
 }
 
 module.exports = NavComponent
 ```

__File : /THEME/main/index.html.sjs__
 ```
module.exports = require('../../templates/pages/IndexPage')
 ```

### Database management : BSON format
 You can enhance the engine with BSON data model or you can create any class that implements `Model` interface. In example :
 ```
const BSON = require("bson")

class UserBson extends BSON {}
 
let selected = []
function each_select (err, data, then) { selected.push(data); then(); }
function each_update (err, data, push) { push(data); }
function next (err) {}

let row = new UserBson(123)
row.load((err) => {
  // to do then...
  row.last_update = new Date().toJSON()
  row.save((err) => {
    // to do then...
  })
})

UserBson.select(each_select, next)
UserBson.update(each_update, next)
UserBson.insert(row, next)
 ```
 
 You can edit BSON file location with: 
 ```
const path = require("path")
const BSON = require("bson")
BSON.FOLDER = path.resolve("your/path/to/data") + "/"
 ```

## Documentation & References

[Documentation & References](#)
