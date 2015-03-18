'use strict';

var fs = require('fs-extra');
var browserify = require('browserify');
var spawn = require('child_process').spawn;
var Promise = require('promise');
var connect = require('connect');
var glob = require('glob');
var serveStatic = require('serve-static');
var path = require('path');

var server;
var tempDir = process.cwd() + '/tmp';

var ncp = require('ncp').ncp;
ncp.limit = 16;

module.exports = function(grunt, args) {
    var config = grunt.config.get('bt') || {},
        testsConfig = config.tests || {},
        testType = Object.keys(testsConfig)[0];// only run the first test suite declared.. for now

    var options = {
        keepalive: args[1] === 'server',
        port: 7755,
        type: testType
    };
    function clean() {
        console.log('cleaning files...');
        return new Promise(function (resolve, reject) {
            fs.remove(tempDir, function (err) {
                if (err) {
                    console.error(err);
                    reject(err);
                } else {
                    resolve();
                    console.log('files cleaned!');
                }
            });
        });
    }

    function runBrowserify() {
        console.log('browserifyin...');
        var fileGlobs = testsConfig[testType] ? testsConfig[testType].src : [],
            outputFile = tempDir + '/tests/built-tests.js',
            data = '',
            stream;
        return new Promise(function (resolve, reject) {
            fileGlobs.forEach(function (pattern) {
                glob(pattern, function (err, paths) {
                    var b = browserify({
                        debug: true,
                        insertGlobalVars: {
                            qunit: function () {
                                return {
                                    id: tempDir + '/tests/qunit/qunit.js'
                                }
                            },
                            'test-utils': function () {
                                return {
                                    id: tempDir + '/tests/qunit/qunit.js'
                                }
                            }
                        }
                    });
                    if (!err) {
                        // must add each path individual unfortunately.
                        paths.forEach(function (path) {
                            b.add(process.cwd() + '/' + path);
                        });
                        stream = b.bundle();
                        stream.on('data', function (d) {
                            data += d.toString();
                        });
                        stream.on('end', function () {
                            fs.outputFile(outputFile, data, function (err) {
                                if (err) reject(err);
                                resolve();
                            });
                        });
                        stream.on('error', console.log);
                    } else {
                        console.error(err);
                        reject();
                    }
                });
            });
        }).then(function () {
                console.log('browserifyin done');
            });
    }

    function runMochaTest() {
        var data = '',
            child = spawn(['mocha-phantomjs'], ['http://localhost:7755/index.html']);
        console.log('running tests...');
        return new Promise(function (resolve) {
            //child.stdout.on('data', function (buffer) {
            //    data += buffer.toString();
            //    console.log(data);
            //});
            //child.stdout.on('end', function () {
                resolve();
            //    console.log('done running tests');
            //});
        });
    }

    function copyFile(filePath) {
        var testsDir = tempDir + '/tests'
        ncp(filePath, testsDir, function (err) {
            if (!err) {
                ncp(internalPath + '/test-utils.js', testsDir, function (err) {
                    console.log(err);
                    if (!err) {
                        console.log('files copied!');
                        resolve();
                    } else {
                        reject(err);
                    }
                });
            } else {
                console.log(err);
                reject(err);
            }
        })
    }

    function copyFiles(options) {
        var testsDir = tempDir + '/tests',
            internalPath = path.join(__dirname, '/test');
        console.log('copying test files over');
        return new Promise(function (resolve, reject) {
            ncp(internalPath + '/' + options.type + '/', testsDir, function (err) {
                if (!err) {
                    ncp(internalPath + '/test-utils.js', testsDir, function (err) {
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
    }

    function stopServer(options) {
        return new Promise(function (resolve) {
            // never resolve promise if we're keeping the server alive
            if (!options.keepalive) {
                console.log('shutting down server...');
                server.close();
                resolve();
            }
        });
    }

    function runServer(options) {
        var folders = ['.' + tempDir, tempDir + '/tests'];
        console.log('running server...');
        return new Promise(function (resolve) {
            // run test server!
            var app = connect();
            // serve multiple directories
            folders.forEach(function (folder) {
                console.log(folder);
                app.use(serveStatic(folder));
            });
            //create node.js http server and listen on port
            server = app.listen(options.port);

            // when server is killed on UNIX-like systems, call close
            process.on('SIGINT', function() {
                server.close();
                resolve();
            });
        });
    }

    function runTest(options) {
        console.log('running ' + options.type + ' tests...');
        return runServer(options).then(function () {
            if (!options.keepalive) {
                return runMochaTest().then(function () {
                    return stopServer(options);
                });
            }
        });
    }

    return clean().then(function () {
        return runBrowserify().then(function () {
            return copyFiles(options).then(function() {
                return runServer(options).then(function () {
                    return runTest(testType).then(function () {
                        return clean();
                    });
                });
            });
        });
    }).catch(function (err) {
        console.error(err);
        clean();
    });
};