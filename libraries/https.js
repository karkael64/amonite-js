module.exports = function (hostname, port, https_options, debug) {

    const HttpCode = require('http-code');
    HttpCode.DEBUG_MODE = debug;

    const motor = require('./motor.build');
    const https = require('https');

    const server = https.createServer(https_options, (req, res) => {
        return motor.execute(req, res, motor.log);
    });

    server.listen(port, hostname, () => {
        return console.log(`Server running at https://${hostname}:${port}/`);
    });

    return motor;
};

