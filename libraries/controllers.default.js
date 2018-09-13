/*
 *  This file create functions as controllers : check conditions and run controller.
 *  Controllers are :
 *  -   Simple File : read a file and send its data ;
 *  -   Exec File : execute a file and send exported data ;
 *  -   Hidden File : if the file requested doesn't exist but this file ended by ".sjs" exists, execute and send its
 *  exported data.
 */


const path = require('path');
const fs = require('fs');
const http = require('http');

const HttpCode = require('http-code');
const Error = HttpCode.prototype.__proto__.constructor;

function is_function(el) {
    return (typeof el === 'function');
}


/**
 * @function getFilename returns ${req} filepath with no '..' and no '//', then normalize it
 * @param req Http.IncomingMessage
 * @returns string
 */

function getFilename(req) {

    let filename = ( '/' + req.file ).replace(/\.\./, '').replace(/\/\//, '/');
    return path.normalize(req.publicPath + filename);
}


function isExecuteFilename(req) {
    let filename = getFilename(req);
    return !!filename.match(/\.sjs$/);
}


//  validators
function isSimpleFile(req, fn) {
    if (req instanceof http.IncomingMessage && is_function(fn)) {
        if (!isExecuteFilename(req)) {
            fs.access(getFilename(req), (err) => {
                fn(!err);
            })
        }
        else
            fn(false);
    }
    else
        throw new Error("Bad arguments");
}

function isExecuteFile(req, fn) {
    if (req instanceof http.IncomingMessage && is_function(fn)) {
        if (isExecuteFilename(req)) {
            fs.access(getFilename(req), (err) => {
                fn(!err);
            });
        }
        else
            fn(false);
    }
    else
        throw new Error("Bad arguments");
}

function isHiddenFile(req, fn) {
    if (req instanceof http.IncomingMessage && is_function(fn)) {
        if (!isExecuteFilename(req)) {
            fs.access(getFilename(req) + ".sjs", (err) => {
                fn(!err);
            });
        }
        else
            fn(false);
    }
    else
        throw new Error("Bad arguments");
}


//  execution
function readSimpleFile(req, res, next) {
    if (req instanceof http.IncomingMessage && is_function(next)) {
        fs.readFile(getFilename(req), next);
    }
    else
        next(new Error("Bad arguments"));
}

function readExecuteFile(req, res, next) {
    if (req instanceof http.IncomingMessage && is_function(next)) {
        try {
            next(null, require(getFilename(req)));
        }
        catch (err) {
            next(err);
        }
    }
    else
        next(new Error("Bad arguments"));
}

function readHiddenFile(req, res, next) {
    if (req instanceof http.IncomingMessage && is_function(next)) {
        try {
            next(null, require(getFilename(req) + '.sjs'));
        }
        catch (err) {
            next(err);
        }
    }
    else
        next(new Error("Bad arguments"));
}


//  controllers

/**
 * @function controller_simpleFile is a "controller" which read and send text of a simple file identified
 * @param req Http.IncomingMessage
 * @param res Http.ServerResponse
 * @param next function
 */

function controller_simpleFile(req, res, next) {
    isSimpleFile(req, (bool) => {
        if (bool)
            next(null, readSimpleFile);
        else
            next(new Error("No match simple file."));
    })
}

/**
 * @function controller_execFile is a "controller" which execute and send object exported by an executable file identified
 * @param req Http.IncomingMessage
 * @param res Http.ServerResponse
 * @param next function
 */

function controller_execFile(req, res, next) {
    isExecuteFile(req, (bool) => {
        if (bool)
            next(null, readExecuteFile);
        else
            next(new Error("No match server file."));
    });
}

/**
 * @function controller_execFile is a "controller" which execute and send object exported by an hidden executable file identified
 * @param req Http.IncomingMessage
 * @param res Http.ServerResponse
 * @param next function
 */

function controller_hiddenFile(req, res, next) {
    isHiddenFile(req, (bool) => {
        if (bool)
            next(null, readHiddenFile);
        else
            next(new Error("No match hidden server file."));
    });
}


module.exports = {
    'simpleFile': controller_simpleFile,
    'execFile': controller_execFile,
    'hiddenFile': controller_hiddenFile
};
