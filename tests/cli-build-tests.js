'use strict';
let sinon = require('sinon');
let mockery = require('mockery');
let Promise = require('bluebird');
let buildPath = './../cli/build';
let testMock, buildMock, utilsMock;
let allowables = ['./../../cli/build', 'bluebird'];

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
        let build = require(buildPath);
        build(['--test=true']).then(function () {
            test.equal(testMock.callCount, 0);
            test.done();
        });
    },

    'should run production tests if test argument is "true" and a test config is specified at root level': function (test) {
        test.expect(2);
        let files = ['testfile.js'];
        let mockConfig = {
            tests: {
                mocha: {
                    files: files
                },
            }
        };
        utilsMock.getConfig.returns(mockConfig);
        let build = require(buildPath);
        build(['--test=true']).then(function () {
            let assertedTestOptions = testMock.args[0][0];
            test.equal(assertedTestOptions.id, 'mocha');
            test.deepEqual(assertedTestOptions.files, files);
            test.done();
        });
    },

    'should only run test configs at production level even if root level tests are specified': function (test) {
        test.expect(3);
        let mockConfig = {
            production: {
                tests: {
                    qunit: {
                        files: ['prod_test_file.js']
                    },
                }
            },
            tests: {
                mocha: {
                    files: ['root_testfile.js']
                },
            }
        };
        utilsMock.getConfig.returns(mockConfig);
        let build = require(buildPath);
        build().then(function () {
            test.equal(testMock.callCount, 1);
            let assertedTestOptions = testMock.args[0][0];
            test.equal(assertedTestOptions.id, 'qunit');
            test.equal(assertedTestOptions.files[0], 'prod_test_file.js');
            test.done();
        });
    },

    'should run production level tests if no arguments are passed but a production build is specified': function (test) {
        test.expect(2);
        let mockConfig = {
            production: {
                tests: {
                    mocha: {
                        files: ['testfile.js']
                    },
                }
            }
        };
        utilsMock.getConfig.returns(mockConfig);
        let build = require(buildPath);
        build().then(function () {
            test.equal(testMock.args[0][0].id, 'mocha');
            test.equal(testMock.args[0][0].files[0], 'testfile.js');
            test.done();
        });
    },

    'should use first argument in command as environment variable for build process': function (test) {
        test.expect(1);
        let mockConfig = {
            production: {}
        };
        utilsMock.getConfig.returns(mockConfig);
        let build = require(buildPath);
        build(['production']).then(function () {
            test.equal(buildMock.args[0][0].env, 'production');
            test.done();
        });
    },

    'should NOT build when there is a environment passed that does not match a configuration': function (test) {
        test.expect(1);
        let build = require(buildPath);
        build(['blah']).then(function () {
            test.equal(buildMock.callCount, 0);
            test.done();
        });
    },

    'should build production environment when no environment is specified': function (test) {
        test.expect(1);
        let build = require(buildPath);
        build().then(function () {
            test.equal(buildMock.args[0][0].env, 'production');
            test.done();
        });
    },

    'should pass watch as true to build call when doing a production build with watch argument': function (test) {
        test.expect(1);
        let mockConfig = {
            production: {}
        };
        utilsMock.getConfig.returns(mockConfig);
        let build = require(buildPath);
        build(['production', '--watch=true']).then(function () {
            test.equal(buildMock.args[0][0].watch, true);
            test.done();
        });
    },

    'should pass watch as true to build call when doing a local build when configuration specifies it': function (test) {
        test.expect(1);
        let mockConfig = {
            local: {
                build: {
                    watch: true
                }
            }
        };
        utilsMock.getConfig.returns(mockConfig);
        let build = require(buildPath);
        build(['local']).then(function () {
            test.equal(buildMock.args[0][0].watch, true);
            test.done();
        });
    },

    'should pass prod config to build when calling it with no arguments': function (test) {
        test.expect(1);
        let files = ['test/path'];
        let mockConfig = {
            production: {
                build: {
                    files: files
                }
            }
        };
        utilsMock.getConfig.returns(mockConfig);
        let build = require(buildPath);
        build().then(function () {
            test.deepEqual(buildMock.args[0][0].files, files);
            test.done();
        });
    },

    'should pass entire build config to build call when config is not nested under a "prod" key': function (test) {
        test.expect(1);
        let mockConfig = {
            build: {
                files: []
            }
        };
        utilsMock.getConfig.returns(mockConfig);
        let build = require(buildPath);
        build().then(function () {
            test.deepEqual(buildMock.args[0][0].files, mockConfig.build.files);
            test.done();
        });
    },

    'should NOT pass files to build call when config for build does not exist': function (test) {
        test.expect(1);
        let mockConfig = {};
        utilsMock.getConfig.returns(mockConfig);
        let build = require(buildPath);
        build().then(function () {
            test.ok(!buildMock.args[0][0].files);
            test.done();
        });
    },

    'should pass custom environment name config files to build when calling it with an argument that matches it': function (test) {
        test.expect(1);
        let files = ['test/path'];
        let mockConfig = {
            beep: {
                build: {
                    files: files
                }
            }
        };
        utilsMock.getConfig.returns(mockConfig);
        let build = require(buildPath);
        build(['beep']).then(function () {
            test.deepEqual(buildMock.args[0][0].files, files);
            test.done();
        });
    },

    'should pass transform in config to build': function (test) {
        test.expect(1);
        let testTransforms = [
            [
                "babelify",
                {
                    "presets": [
                        "es2015"
                    ]
                }
            ]
        ];
        let mockConfig = {
            build: {
                browserifyOptions: {
                    transform: testTransforms
                },
            }
        };
        utilsMock.getConfig.returns(mockConfig);
        let build = require(buildPath);
        build().then(function () {
            test.deepEqual(buildMock.args[0][0].browserifyOptions.transform, testTransforms);
            test.done();
        });
    },

    'should pass build test configs files to test function correctly': function (test) {
        test.expect(2);
        let firstTestConfig = {
            mocha: {
                files: ['test/file1.js']
            }
        };
        let secondTestConfig = {
            mocha: {
                files: ['tests/file2.js']
            }
        };
        let mockConfig = {
            tests: [firstTestConfig, secondTestConfig]
        };
        utilsMock.getConfig.returns(mockConfig);
        let build = require(buildPath);
        build().then(function () {
            test.deepEqual(testMock.args[0][0].files, firstTestConfig.mocha.files);
            test.deepEqual(testMock.args[1][0].files, secondTestConfig.mocha.files);
            test.done();
        });
    },

    'should pass build test type to test function correctly': function (test) {
        test.expect(2);
        let firstTestConfig = {
            mocha: {
                files: ['test/file1.js']
            }
        };
        let secondTestConfig = {
            qunit: {
                files: ['tests/file2.js']
            }
        };
        let mockConfig = {
            tests: [firstTestConfig, secondTestConfig]
        };
        utilsMock.getConfig.returns(mockConfig);
        let build = require(buildPath);
        build().then(function () {
            test.equal(testMock.args[0][0].id, 'mocha');
            test.equal(testMock.args[1][0].id, 'qunit');
            test.done();
        });
    },


};
