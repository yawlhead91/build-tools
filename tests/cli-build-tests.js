'use strict';
var sinon = require('sinon');
var mockery = require('mockery');
var Promise = require('bluebird');
var buildPath = './../cli/build';
var testMock, buildMock, utilsMock;
var allowables = ['./../../cli/build', 'bluebird'];

module.exports = {

    setUp: function (cb) {
        mockery.enable({useCleanCache: true});
        mockery.warnOnUnregistered(false); // suppress non-allowed modules
        mockery.registerAllowables(allowables);
        testMock = sinon.stub().returns(Promise.resolve());
        buildMock = sinon.stub().returns(Promise.resolve());
        utilsMock = {
            getConfig: sinon.stub()
        };
        mockery.registerMock('./../src/test', testMock);
        mockery.registerMock('./../src/utils', utilsMock);
        mockery.registerMock('./../src/build', buildMock);
        cb();
    },

    tearDown: function (cb) {
        mockery.deregisterAll();
        mockery.disable();
        cb();
    },

    'should NOT run tests if test argument is "true" and there is no test config': function (test) {
        test.expect(1);
        var build = require(buildPath);
        build(['--test=true']).then(function () {
            test.equal(testMock.callCount, 0);
            test.done();
        });
    },

    'should run production tests if test argument is "true" and a test config is specified at root level': function (test) {
        test.expect(2);
        var files = ['testfile.js'];
        var mockConfig = {
            tests: {
                mocha: {
                    src: files
                },
            }
        };
        utilsMock.getConfig.returns(mockConfig);
        var build = require(buildPath);
        build(['--test=true']).then(function () {
            var assertedTestOptions = testMock.args[0][0];
            test.equal(assertedTestOptions.id, 'mocha');
            test.deepEqual(assertedTestOptions.files, files);
            test.done();
        });
    },

    'should only run test configs at production level even if root level tests are specified': function (test) {
        test.expect(3);
        var mockConfig = {
            production: {
                tests: {
                    qunit: {
                        src: ['prod_test_file.js']
                    },
                }
            },
            tests: {
                mocha: {
                    src: ['root_testfile.js']
                },
            }
        };
        utilsMock.getConfig.returns(mockConfig);
        var build = require(buildPath);
        build().then(function () {
            test.equal(testMock.callCount, 1);
            var assertedTestOptions = testMock.args[0][0];
            test.equal(assertedTestOptions.id, 'qunit');
            test.equal(assertedTestOptions.files[0], 'prod_test_file.js');
            test.done();
        });
    },

    'should run production level tests if no arguments are passed but a production build is specified': function (test) {
        test.expect(2);
        var mockConfig = {
            production: {
                tests: {
                    mocha: {
                        src: ['testfile.js']
                    },
                }
            }
        };
        utilsMock.getConfig.returns(mockConfig);
        var build = require(buildPath);
        build().then(function () {
            test.equal(testMock.args[0][0].id, 'mocha');
            test.equal(testMock.args[0][0].files[0], 'testfile.js');
            test.done();
        });
    },

    'should use first argument in command as environment variable for build process': function (test) {
        test.expect(1);
        var mockConfig = {
            production: {}
        };
        utilsMock.getConfig.returns(mockConfig);
        var build = require(buildPath);
        build(['production']).then(function () {
            test.equal(buildMock.args[0][0].env, 'production');
            test.done();
        });
    },

    'should NOT build when there is a environment passed that does not match a configuration': function (test) {
        test.expect(1);
        var build = require(buildPath);
        build(['blah']).then(function () {
            test.equal(buildMock.callCount, 0);
            test.done();
        });
    },

    'should build production environment when no environment is specified': function (test) {
        test.expect(1);
        var build = require(buildPath);
        build().then(function () {
            test.equal(buildMock.args[0][0].env, 'production');
            test.done();
        });
    },

    'should pass watch as true to build call when doing a production build with watch argument': function (test) {
        test.expect(1);
        var mockConfig = {
            production: {}
        };
        utilsMock.getConfig.returns(mockConfig);
        var build = require(buildPath);
        build(['production', '--watch=true']).then(function () {
            test.equal(buildMock.args[0][0].watch, true);
            test.done();
        });
    },

    'should pass watch as true to build call when doing a local build when configuration specifies it': function (test) {
        test.expect(1);
        var mockConfig = {
            local: {
                build: {
                    watch: true
                }
            }
        };
        utilsMock.getConfig.returns(mockConfig);
        var build = require(buildPath);
        build(['local']).then(function () {
            test.equal(buildMock.args[0][0].watch, true);
            test.done();
        });
    },

    'should pass prod config to build when calling it with no arguments': function (test) {
        test.expect(1);
        var files = ['test/path'];
        var mockConfig = {
            production: {
                build: {
                    files: files
                }
            }
        };
        utilsMock.getConfig.returns(mockConfig);
        var build = require(buildPath);
        build().then(function () {
            test.deepEqual(buildMock.args[0][0].files, files);
            test.done();
        });
    },

    'should pass entire build config to build call when config is not nested under a "prod" key': function (test) {
        test.expect(1);
        var mockConfig = {
            build: {
                files: []
            }
        };
        utilsMock.getConfig.returns(mockConfig);
        var build = require(buildPath);
        build().then(function () {
            test.deepEqual(buildMock.args[0][0].files, mockConfig.build.files);
            test.done();
        });
    },

    'should NOT pass files to build call when config for build does not exist': function (test) {
        test.expect(1);
        var mockConfig = {};
        utilsMock.getConfig.returns(mockConfig);
        var build = require(buildPath);
        build().then(function () {
            test.ok(!buildMock.args[0][0].files);
            test.done();
        });
    },

    'should pass custom environment name config files to build when calling it with an argument that matches it': function (test) {
        test.expect(1);
        var files = ['test/path'];
        var mockConfig = {
            beep: {
                build: {
                    files: files
                }
            }
        };
        utilsMock.getConfig.returns(mockConfig);
        var build = require(buildPath);
        build(['beep']).then(function () {
            test.deepEqual(buildMock.args[0][0].files, files);
            test.done();
        });
    },

    'should pass transform in config to build': function (test) {
        test.expect(1);
        var testTransforms = [
            [
                "babelify",
                {
                    "presets": [
                        "es2015"
                    ]
                }
            ]
        ];
        var mockConfig = {
            build: {
                browserifyOptions: {
                    transform: testTransforms
                },
            }
        };
        utilsMock.getConfig.returns(mockConfig);
        var build = require(buildPath);
        build().then(function () {
            test.deepEqual(buildMock.args[0][0].browserifyOptions.transform, testTransforms);
            test.done();
        });
    },

    'should pass build test configs src files to test function correctly': function (test) {
        test.expect(2);
        var firstTestConfig = {
            mocha: {
                src: ['test/file1.js']
            }
        };
        var secondTestConfig = {
            mocha: {
                src: ['tests/file2.js']
            }
        };
        var mockConfig = {
            tests: [firstTestConfig, secondTestConfig]
        };
        utilsMock.getConfig.returns(mockConfig);
        var build = require(buildPath);
        build().then(function () {
            test.deepEqual(testMock.args[0][0].files, firstTestConfig.mocha.src);
            test.deepEqual(testMock.args[1][0].files, secondTestConfig.mocha.src);
            test.done();
        });
    },

    'should pass build test type to test function correctly': function (test) {
        test.expect(2);
        var firstTestConfig = {
            mocha: {
                src: ['test/file1.js']
            }
        };
        var secondTestConfig = {
            qunit: {
                src: ['tests/file2.js']
            }
        };
        var mockConfig = {
            tests: [firstTestConfig, secondTestConfig]
        };
        utilsMock.getConfig.returns(mockConfig);
        var build = require(buildPath);
        build().then(function () {
            test.equal(testMock.args[0][0].id, 'mocha');
            test.equal(testMock.args[1][0].id, 'qunit');
            test.done();
        });
    },


};
