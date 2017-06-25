let fs = require('fs-extra');
let spawn = require('child_process').spawn;
let express = require('express');
let serveStatic = require('serve-static');
let path = require('path');
let utils = require('./utils');
let clean = require('./clean');
let browserify = require('./browserify');
let qunit = require('node-qunit-phantomjs');
let Server = require('./server');
let phantomjs = require('phantomjs-prebuilt');

let server;
let tempDir = process.cwd() + '/tmp';

let ncp = require('ncp').ncp;
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

    options = Object.assign({}, {
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
        let opts = Object.assign({}, options.browserifyOptions, options);
        opts.files = {};
        opts.files[tempDir + '/tests/built-tests.js'] = options.files;
        opts.watch = options.keepalive;
        return browserify(opts);
    }

    function runMochaTest() {
        let child = spawn(phantomjs.path, [
            require.resolve('mocha-phantomjs-core'),
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
        let promise;

        console.log('running ' + options.id + ' tests...');
        if (options.id.toLowerCase() === 'qunit') {
            promise = runQunitTest();
        } else {
            promise = runMochaTest();
        }

        return promise;

    }

    function copyFiles() {
        let testsDir = tempDir + '/tests/',
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
        let folders = ['.' + tempDir, tempDir + '/tests'];
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
                let error;
                if (!options.keepalive) {
                    return test()
                        .catch((e) => {
                            error = e;
                        })
                        .then(() => {
                            return server.stop().then(() => {
                                if (error) {
                                    throw new Error(error);
                                }
                            });
                    });
                }
            });
        });
    });
};
