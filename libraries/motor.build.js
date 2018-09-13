/*
 *  This file :
 *  1.  instanciate a Motor object,
 *  2.  set ${req <Http.IncomingMessage>}.file as ${req}.url, and if it ends with '/', replace it by '/index.html'
 *  3.  set ${req}.arguments as an Arguments instance
 *  4.  set ${req}.arguments.
 *  Then exports this motor instance.
 */

const Arguments = require('http-arguments');
const ctrls = require('./controllers.default');
const Amonite = require('./motor');
const fs = require('fs');

const motor = new Amonite();

motor.registerConfiguration((req, res, next) => {
    res.start = Date.now();
    req.file = req.url.replace(/(\?|#).*$/, '').replace(/\/$/, '/index.html');

    let a = new Arguments();
    a.set(req, next);
    req.arguments = a;
});

motor.log = function log(err, req, res) {

    if (err) {
        res.end('' + err);
        let length = Date.now() - res.start,
            stack = err.stack.split(/[\s]*\n[\s]*at /g);
        stack.shift();
        fs.writeFile(Amonite.logFile, JSON.stringify({
            'method': req.method,
            'length': length,
            'request': req.file,
            'error': {'code': err.code, 'message': err.message, 'stack': err.stack, 'date': Date.now()}
        }) + '\n', {'flag': 'a'}, function () {
        });
    }
    else {
        let length = Date.now() - res.start;
        fs.writeFile(Amonite.logFile, JSON.stringify({
            'method': req.method,
            'length': length,
            'request': req.file,
            'code': res.httpCode.getCode(),
            'date': Date.now()
        }) + '\n', {'flag': 'a'}, function () {
        });
    }
};

motor.registerController(ctrls.simpleFile);
motor.registerController(ctrls.execFile);
motor.registerController(ctrls.hiddenFile);

module.exports = motor;