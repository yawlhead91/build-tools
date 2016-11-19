'use strict';

var fs = require('fs-extra');
var spawn = require('child_process').spawn;
var Promise = require('promise');
var express = require('express');
var serveStatic = require('serve-static');
var path = require('path');
var _ = require('underscore');
var utils = require('./utils');
var clean = require('./clean');
var browserify = require('./browserify');
var qunit = require('node-qunit-phantomjs');
var Server = require('./server');

var server;
var tempDir = process.cwd() + '/tmp';

var ncp = require('ncp').ncp;
ncp.limit = 16;

/**
 *
 * @param {Object} [options] - The test options object
 * @param {String} options.id - Unique identifier for the type of test (.eg 'mocha', 'qunit')
 * @param {Array} options.files - The array of file paths to tests
 * @param {boolean} [options.keepalive] - Whether to keep alive the test server
 * @param {Number} [options.port] - Optional port to start server on (default to 7755)
 * @param {Object} [options.requires] - A id-url map object of global requires
 * @param {Array} [options.plugins] - An array of plugins
 * @param {Object} [options.browserifyOptions] - Browserify options
 * @returns {*}
 */
module.exports = function(options) {

    options = _.extend({}, {
        id: 'mocha',
        port: 7755,
        keepalive: false,
        requires: {},
        files: [],
        plugins: [],
        ignore: [],
        exclude: [],
        browserifyOptions: {}
    }, options);

    if (!options.id || !options.files || !options.files.length) {
        console.warn('no test configuration specified or no matching files were found');
        return Promise.resolve();
    }

    function runBrowserify() {

        // expose "qunit" and "test-utils" variables to external project
        if (options.id === 'qunit') {
            options.requires['qunit'] = tempDir + '/tests/qunit.js';
        }
        // options.requires['test-utils'] = tempDir + '/tests/test-utils.js';

        // convert files to an object for browserify process
        let opts = _.extend(options.browserifyOptions, options);
        opts.files = {};
        opts.files[tempDir + '/tests/built-tests.js'] = options.files;
        opts.watch = options.keepalive;
        return browserify(opts);
    }

    function runMochaTest() {
        var binPath = process.cwd() + '/node_modules/.bin/phantomjs';
        var child = spawn(binPath, [
            process.cwd() + '/node_modules/mocha-phantomjs-core/mocha-phantomjs-core.js',
            tempDir + '/tests/index.html'
        ]);
        return new Promise(function (resolve, reject) {
            child.stdout.on('data', function (buffer) {
                process.stdout.write(buffer.toString());
            });
            child.stderr.on('data', function (buffer) {
                console.error(buffer.toString());
            });
            child.on('close', function (code) {
                if (code) {
                    reject(new Error("tests failed"));
                    console.log(arguments);
                } else {
                    console.log('done running tests');
                    resolve(code);
                }
            });

            child.on('error', function (errorCode) {
                console.log('error!');
                console.log(arguments);
                reject(new Error(errorCode));
            });
        });
    }

    function runQunitTest() {
        return new Promise(function (resolve, reject) {
            qunit('http://localhost:' + options.port + '/index.html', {'verbose': true}, function (err) {
                if (!err) {
                    resolve();
                } else {
                    reject(err);
                }
            });
        });
    }

    function test() {
        var promise;

        console.log('running ' + options.id + ' tests...');
        if (options.id.toLowerCase() === 'qunit') {
            promise = runQunitTest();
        } else {
            promise = runMochaTest();
        }

        return new Promise(function (resolve) {
            promise.then(resolve);
            promise.catch(function (err) {
                // still resolve with the error code even though we have error to ensure
                // processes that follow still have a chance to run
                console.log(err);
                resolve(err);
            });
        });

    }

    function copyFiles() {
        var testsDir = tempDir + '/tests/',
            internalPath = path.join(__dirname, '/test');
        console.log('copying test files over');
        return new Promise(function (resolve, reject) {
            fs.ensureDir(testsDir, function () {
                ncp(internalPath + '/' + options.id + '/', testsDir, function (err) {
                    if (!err) {
                        ncp(internalPath + '/test-utils.js', testsDir + '/test-utils.js', function (err) {
                            if (!err) {
                                console.log('files copied!');
                                resolve();
                            } else {
                                reject(err);
                            }
                        });
                    } else {
                        reject(err);
                    }
                });
            });
        });
    }

    function cleanTempFiles() {
        console.log('cleaning up temporary files');
        return clean(tempDir);
    }

    function getServer() {
        var folders = ['.' + tempDir, tempDir + '/tests'];
        if (!server) {
            server = new Server({
                port: options.port,
                middleware: (app) => {
                    // serve multiple directories
                    folders.forEach(function (folder) {
                        app.use(serveStatic(folder));
                    });
                },
                onServerEnd: function () {
                    return cleanTempFiles()
                }
            });
        }
        return server;
    }

    // in case the process is stopped after files have
    // been injected but the server hasnt yet started
    process.on('SIGINT', function() {
        cleanTempFiles().then(() => {
            process.exit();
        });
    });
    return copyFiles().then(function() {
        return runBrowserify().then(function () {
            let server = getServer();
            return server.start().then(() => {
                // dont run test automatically if the intent is to keep the
                // connection alive for local development in a browser etc
                if (!options.keepalive) {
                    return test().then(() => {
                        return server.stop();
                    });
                }
            });
        });
    });
};
