'use strict';
var sinon = require('sinon');
var mockery = require('mockery');
var Promise = require("promise");
var testStub;
var allowables = ['nopt', 'path', 'underscore'];
var utilsMock;

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
        var testSourceFilePath = 'tests/scroll-tests.js';
        var mockConfig = {
            tests: {
                mocha: {
                    src: [testSourceFilePath],
                },
            }
        };
        utilsMock.getConfig.returns(mockConfig);
        var cliTest = require('./../cli/test');
        cliTest().then(function () {
            test.equal(testStub.args[0][0].files[0], testSourceFilePath);
            test.done();
        });
    },

    'should call test function with correct browserify options when specified in config': function (test) {
        test.expect(1);
        var testBrowserifyOptions = {
            myOption: 'test',
        };
        var mockConfig = {
            tests: {
                browserifyOptions: testBrowserifyOptions,
            }
        };
        utilsMock.getConfig.returns(mockConfig);
        var cliTest = require('./../cli/test');
        cliTest().then(function () {
            test.deepEqual(testStub.args[0][0].browserifyOptions, testBrowserifyOptions);
            test.done();
        });
    },

};
