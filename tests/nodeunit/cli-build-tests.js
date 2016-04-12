'use strict';
var sinon = require('sinon');
var mockery = require('mockery');
var Promise = require("promise");
var buildPath = './../../cli/build';
var testMock, buildMock, utilsMock, configApiStub;
var allowables = ['./../../cli/build'];

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
        mockery.registerMock('./test', testMock);
        mockery.registerMock('./../src/utils', utilsMock);
        mockery.registerMock('./../src/build', buildMock);
        cb();
    },

    tearDown: function (cb) {
        mockery.deregisterAll();
        mockery.disable();
        cb();
    },

    'should NOT run tests if env is "local"': function (test) {
        test.expect(1);
        var build = require(buildPath);
        build(['local']).then(function () {
            test.equal(testMock.callCount, 0);
            test.done();
        });
    },

    'should run tests if test argument is "true"': function (test) {
        test.expect(1);
        var build = require(buildPath);
        build(['--test=true']).then(function () {
            test.equal(testMock.callCount, 1);
            test.done();
        });
    },

    'should run tests if no arguments are passed': function (test) {
        test.expect(1);
        var build = require(buildPath);
        build().then(function () {
            test.equal(testMock.callCount, 1);
            test.done();
        });
    },

    'should pass prod as env when build is called with no arguments': function (test) {
        test.expect(1);
        var build = require(buildPath);
        build().then(function () {
            test.equal(buildMock.args[0][0].env, 'prod');
            test.done();
        });
    },

    'should pass env to build process': function (test) {
        test.expect(1);
        var build = require(buildPath);
        build(['prod']).then(function () {
            test.equal(buildMock.args[0][0].env, 'prod');
            test.done();
        });
    },

    'should pass watch as true to build call when doing a prod build with watch argument': function (test) {
        test.expect(1);
        var build = require(buildPath);
        build(['prod', '--watch=true']).then(function () {
            test.equal(buildMock.args[0][0].watch, true);
            test.done();
        });
    },

    'should pass watch as true to build call when doing a local build, even when watch has not be passed as an argument': function (test) {
        test.expect(1);
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
            build: {
                prod: {
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

    'should pass prod config to build when calling it with local argument': function (test) {
        test.expect(1);
        var files = ['test/path'];
        var mockConfig = {
            build: {
                prod: {
                    files: files
                }
            }
        };
        utilsMock.getConfig.returns(mockConfig);
        var build = require(buildPath);
        build(['local']).then(function () {
            test.deepEqual(buildMock.args[0][0].files, files);
            test.done();
        });
    }


};
