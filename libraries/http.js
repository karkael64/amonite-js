module.exports = function (hostname, port, debug) {

    const HttpCode = require('http-code');
    HttpCode.DEBUG_MODE = debug;

    const motor = require('./motor.build');
    const http = require('http');

    const server = http.createServer((req, res) => {
        return motor.execute(req, res, motor.log);
    });

    server.listen(port, hostname, () => {
        return console.log(`Server running at http://${hostname}:${port}/`);
    });

    return motor;
};


