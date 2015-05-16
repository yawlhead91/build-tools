'use strict';

var fs = require('fs-extra');
var spawn = require('child_process').spawn;
var Promise = require('promise');
var connect = require('connect');
var serveStatic = require('serve-static');
var path = require('path');
var _ = require('underscore');
var utils = require('./utils');
var clean = require('./clean');

var server;
var tempDir = process.cwd() + '/tmp';
var internalModulePath = path.resolve(__dirname, '..');

var ncp = require('ncp').ncp;
ncp.limit = 16;

/**
 *
 * @param {Object} config - The configuration obj
 * @param options
 * @param {boolean} options.keepalive - Whether to keep alive the test server
 * @param {Number} options.port - Optional port to start server on (default to 7755)
 * @returns {*}
 */
module.exports = function(config, options) {

    var testsConfig = config.tests || {},
        testId = Object.keys(testsConfig)[0], // only run the first test suite declared.. for now
        src = testsConfig[testId].src || [];

    options = _.extend({}, {
        port: 7755,
        keepalive: false
    }, options);
    
    if (!testId || !src) {
        return Promise.resolve();
    }

    function runBrowserify() {
        var requirePaths = {};
        if (testId === 'qunit') {
            requirePaths['qunit'] = tempDir + '/tests/qunit.js';
        }
        requirePaths['test-utils'] = tempDir + '/tests/test-utils.js';
        var fileMap = {};
        fileMap[tempDir + '/tests/built-tests.js'] = src;

        return utils.browserifyFiles({
            files: fileMap,
            requires: requirePaths,
            browserifyOptions: {
                debug: true
            }
        });
    }

    function test() {
        var nameMap = {
                mocha: 'mocha-phantomjs',
                qunit: 'node-qunit-phantomjs'
            },
            cmd = internalModulePath + '/node_modules/.bin/' + nameMap[testId],
            child;

        console.log('running ' + testId + ' tests...');

        child = spawn(cmd, ['http://localhost:7755/index.html']);

        return new Promise(function (resolve, reject) {
            child.stdout.on('data', function (buffer) {
                process.stdout.write(buffer.toString());
            });
            child.on('close', function (code) {
                console.log('done running tests');
                resolve(code);
            });

            child.stdout.on('error', reject);
        });
    }

    function copyFiles() {
        var testsDir = tempDir + '/tests/',
            internalPath = path.join(__dirname, '/test');
        console.log('copying test files over');
        return new Promise(function (resolve, reject) {
            fs.ensureDir(testsDir, function () {
                ncp(internalPath + '/' + testId + '/', testsDir, function (err) {
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

    function stopServer() {
        return new Promise(function (resolve) {
            console.log('shutting down server...');
            if (server) {
                server.close();
                resolve();
            }
        });
    }

    function runServer() {
        var folders = ['.' + tempDir, tempDir + '/tests'];
        console.log('running server...');
        return new Promise(function (resolve) {
            // run test server!
            var app = connect();
            // serve multiple directories
            folders.forEach(function (folder) {
                app.use(serveStatic(folder));
            });
            //create node.js http server and listen on port
            server = app.listen(options.port);

            // when server is killed on UNIX-like systems, call close
            process.on('SIGINT', function() {
                server.close();
            });
            server.on('close', function () {
                resolve();
            });
            console.log('server started!');

            if (!options.keepalive) {
                resolve();
            }
        });
    }

    function runTest() {
        return runServer().then(function () {
            if (!options.keepalive) {
                return test().then(function (errorCode) {
                    return stopServer().then(function () {
                        return clean(tempDir).then(function () {
                            if (errorCode) {
                                throw new Error('test failure');
                            }
                        });
                    });
                });
            }
        });
    }

    return clean(tempDir).then(function () {
        return copyFiles().then(function() {
            return runBrowserify().then(function () {
                return runTest();
            });
        });
    });
};