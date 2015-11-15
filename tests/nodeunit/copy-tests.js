'use strict';
var sinon = require('sinon');
var testPath = './../../src/copy';
var mockery = require('mockery');

var fsMock;

var allowables = ['util', testPath, 'promise'];

module.exports = {

    setUp: function (cb) {
        mockery.enable({useCleanCache: true});
        mockery.warnOnUnregistered(false); // suppress non-allowed modules
        fsMock = {
            copy: sinon.stub()
        };
        mockery.registerMock('fs-extra', fsMock);
        mockery.registerAllowables(allowables);
        cb();
    },

    tearDown: function (cb) {
        mockery.deregisterAll();
        mockery.disable();
        cb();
    },

    'should resolve immediately without error when called with no arguments': function (test) {
        test.expect(1);
        var copy = require(testPath);
        return copy().then(function () {
            test.ok('true');
            test.done();
        }, test.done);
    },

    'should resolve immediately when called with empty object as first argument': function (test) {
        test.expect(1);
        var copy = require(testPath);
        return copy({}).then(function () {
            test.ok('true');
            test.done();
        }, test.done);
    },

    'should call fs.copy with correct arguments': function (test) {
        test.expect(2);
        var copy = require(testPath);
        var srcPaths = ['app/index.html'];
        var destPath = 'build/index.html';
        var filesMap = {};
        filesMap[destPath] = srcPaths;
        fsMock.copy.callsArg(2); // make sure promises are resolved
        return copy({files: filesMap}).then(function () {
            test.equal(fsMock.copy.args[0][0], srcPaths[0]);
            test.equal(fsMock.copy.args[0][1], destPath);
            test.done();
        }, test.done);
    }

};


