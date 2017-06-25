'use strict';
let sinon = require('sinon');
let mockery = require('mockery');
let testStub;
let allowables = [
    'nopt',
    'bluebird',
    'path',
];
let utilsMock;

module.exports = {

    setUp: function (cb) {
        mockery.enable({useCleanCache: true});
        mockery.warnOnUnregistered(false); // suppress non-allowed modules
        mockery.registerAllowables(allowables);
        testStub = sinon.stub().returns(Promise.resolve());

        mockery.registerMock('./../src/test', testStub);
        utilsMock = {
            getConfig: sinon.stub()
        };
        mockery.registerMock('./../src/utils', utilsMock);
        cb();
    },

    tearDown: function (cb) {
        mockery.deregisterAll();
        mockery.disable();
        cb();
    },

    'should call test function with correct files option when mocha src files are in config': function (test) {
        test.expect(1);
        let testSourceFilePath = 'tests/scroll-tests.js';
        let mockConfig = {
            tests: {
                mocha: {
                    files: [testSourceFilePath],
                },
            }
        };
        utilsMock.getConfig.returns(mockConfig);
        let cliTest = require('./../cli/test');
        cliTest().then(function () {
            test.equal(testStub.args[0][0].files[0], testSourceFilePath);
            test.done();
        });
    },

    'should call test function with root level browserify options when browserify options are at the test-type level': function (test) {
        test.expect(1);
        let testBrowserifyOptions = {
            myOption: 'test',
        };
        let mockConfig = {
            tests: {
                mocha: {
                    browserifyOptions: testBrowserifyOptions,
                }
            }
        };
        utilsMock.getConfig.returns(mockConfig);
        let cliTest = require('./../cli/test');
        cliTest().then(function () {
            test.deepEqual(testStub.args[0][0].browserifyOptions, testBrowserifyOptions);
            test.done();
        });
    },

    'should call test function with root level browserify options when browserify options are at the tests level': function (test) {
        test.expect(1);
        let testBrowserifyOptions = {
            myOption: 'test',
        };
        let mockConfig = {
            tests: {
                mocha: {},
                browserifyOptions: testBrowserifyOptions,
            }
        };
        utilsMock.getConfig.returns(mockConfig);
        let cliTest = require('./../cli/test');
        cliTest().then(function () {
            test.deepEqual(testStub.args[0][0].browserifyOptions, testBrowserifyOptions);
            test.done();
        });
    },

    'should call test function with environment level browserify options when browserify options are at the test-type level': function (test) {
        test.expect(1);
        let testBrowserifyOptions = {
            myOption: 'test',
        };
        let mockConfig = {
            production: {
                tests: {
                    mocha: {
                        browserifyOptions: testBrowserifyOptions,
                    }
                }
            }
        };
        utilsMock.getConfig.returns(mockConfig);
        let cliTest = require('./../cli/test');
        cliTest(['--env=production']).then(function () {
            test.deepEqual(testStub.args[0][0].browserifyOptions, testBrowserifyOptions);
            test.done();
        });
    },

    'should call test function with browserify options when browserify options are at the test level': function (test) {
        test.expect(1);
        let testBrowserifyOptions = {
            myOption: 'test',
        };
        let mockConfig = {
            production: {
                tests: {
                    mocha: {},
                    browserifyOptions: testBrowserifyOptions,
                }
            }
        };
        utilsMock.getConfig.returns(mockConfig);
        let cliTest = require('./../cli/test');
        cliTest(['--env=production']).then(function () {
            test.deepEqual(testStub.args[0][0].browserifyOptions, testBrowserifyOptions);
            test.done();
        });
    },

    'should call test function with root level config options when root level configuration options are present': function (test) {
        test.expect(2);
        let testFiles = ['testFile.js'];
        let mockConfig = {
            tests: {
                mocha: {
                    files: testFiles,
                }
            }
        };
        utilsMock.getConfig.returns(mockConfig);
        let cliTest = require('./../cli/test');
        cliTest().then(function () {
            let assertedTestOptions = testStub.args[0][0];
            test.deepEqual(assertedTestOptions.files, testFiles);
            test.equal(assertedTestOptions.id, 'mocha');
            test.done();
        });
    },

    'should test with development config when there is one if no test environment is supplied': function (test) {
        test.expect(2);
        let testFiles = ['test.js'];
        let mockConfig = {
            development: {
                tests: {
                    mocha: {
                        files: testFiles,
                    }
                }
            }
        };
        utilsMock.getConfig.returns(mockConfig);
        let cliTest = require('./../cli/test');
        cliTest().then(function () {
            let assertedTestOptions = testStub.args[0][0];
            test.deepEqual(assertedTestOptions.files, testFiles);
            test.equal(assertedTestOptions.id, 'mocha');
            test.done();
        });
    },

    'should pass correct test options when test type is passed': function (test) {
        test.expect(2);
        let testFiles = ['test.js'];
        let mockConfig = {
            tests: {
                qunit: {
                    files: testFiles,
                }
            }
        };
        utilsMock.getConfig.returns(mockConfig);
        let cliTest = require('./../cli/test');
        cliTest(['qunit']).then(function () {
            let assertedTestOptions = testStub.args[0][0];
            test.deepEqual(assertedTestOptions.files, testFiles);
            test.equal(assertedTestOptions.id, 'qunit');
            test.done();
        });
    },

    'should pass keepalive as true in test options when server command is used': function (test) {
        test.expect(1);
        let testFiles = ['test.js'];
        let mockConfig = {
            tests: {
                qunit: {
                    files: testFiles,
                }
            }
        };
        utilsMock.getConfig.returns(mockConfig);
        let cliTest = require('./../cli/test');
        cliTest(['qunit', 'server']).then(function () {
            let assertedTestOptions = testStub.args[0][0];
            test.equal(assertedTestOptions.keepalive, true);
            test.done();
        });
    },

    'should not pass keepalive true when trying to start test server when there is a test configuration with multiple test types': function (test) {
        test.expect(1);
        let testFiles = ['test.js'];
        let mockConfig = {
            tests: {
                qunit: {
                    files: testFiles,
                },
                mocha: {
                    files: testFiles,
                }
            }
        };
        utilsMock.getConfig.returns(mockConfig);
        let cliTest = require('./../cli/test');
        cliTest(['test', 'server']).then(function () {
            test.ok(!testStub.args[0][0].keepalive);
            test.done();
        });
    },

    'should not pass keepalive true when trying to start test server when there are multiple test configurations with same test type': function (test) {
        test.expect(1);
        let mockConfig = {
            tests: [
                {mocha: {files: ['test1.js']}},
                {mocha: {files: ['test2.js']}}
            ]
        };
        utilsMock.getConfig.returns(mockConfig);
        let cliTest = require('./../cli/test');
        cliTest(['test', 'server']).then(function () {
            test.ok(!testStub.args[0][0].keepalive);
            test.done();
        });
    },

    'should not pass keepalive true when trying to start test types server when there are multiple test configurations with same test type': function (test) {
        test.expect(1);
        let mockConfig = {
            tests: [
                {mocha: {files: ['test1.js']}},
                {mocha: {files: ['test2.js']}}
            ]
        };
        utilsMock.getConfig.returns(mockConfig);
        let cliTest = require('./../cli/test');
        cliTest(['mocha', 'server']).then(function () {
            test.ok(!testStub.args[0][0].keepalive);
            test.done();
        });
    },

    'should pass keepalive as true for the passed test type if there is only one configuration for the passed test type': function (test) {
        test.expect(1);
        let testFiles = ['test.js'];
        let mockConfig = {
            tests: {
                qunit: {
                    files: testFiles,
                },
                mocha: {
                    files: testFiles,
                }
            }
        };
        utilsMock.getConfig.returns(mockConfig);
        let cliTest = require('./../cli/test');
        cliTest(['qunit', 'server']).then(function () {
            test.equal(testStub.args[0][0].keepalive, true);
            test.done();
        });
    },

};
