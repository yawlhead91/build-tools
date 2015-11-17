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

var server;
var tempDir = process.cwd() + '/tmp';
var internalModulePath = path.resolve(__dirname, '..');

var ncp = require('ncp').ncp;
ncp.limit = 16;

/**
 *
 * @param {Object} [options] - The test options object
 * @param {String} options.id - Unique identifier for the type of test (.eg 'mocha', 'qunit')
 * @param {Array} options.files - The array of file paths to tests
 * @param {boolean} [options.keepalive] - Whether to keep alive the test server
 * @param {Number} [options.port] - Optional port to start server on (default to 7755)
 * @returns {*}
 */
module.exports = function(options) {

    options = _.extend({}, {
        id: 'mocha',
        port: 7755,
        keepalive: false,
        files: []
    }, options);

    if (!options.id || !options.files || !options.files.length) {
        console.warn('no test configuration specified or no matching files were found');
        return Promise.resolve();
    }

    function runBrowserify() {
        var requirePaths = {};
        if (options.id === 'qunit') {
            requirePaths['qunit'] = tempDir + '/tests/qunit.js';
        }
        requirePaths['test-utils'] = tempDir + '/tests/test-utils.js';
        var fileMap = {};
        fileMap[tempDir + '/tests/built-tests.js'] = options.files;

        return browserify({
            files: fileMap,
            requires: requirePaths,
            watch: true,
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
            cmd = internalModulePath + '/node_modules/.bin/' + nameMap[options.id],
            child;

        console.log('running ' + options.id + ' tests...');

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
            var app = express();
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
            return runBrowserify(options).then(function () {
                return runTest();
            });
        });
    });
};