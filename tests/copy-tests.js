'use strict';
var sinon = require('sinon');
var testPath = './../src/copy';
var mockery = require('mockery');

var fsMock;
var globMock;
var chokidarMock;
var chokidarInstance;

var allowables = ['util', testPath, 'promise', 'async-promises'];

module.exports = {

    setUp: function (cb) {
        mockery.enable({useCleanCache: true});
        mockery.warnOnUnregistered(false); // suppress non-allowed modules
        fsMock = {
            copy: sinon.stub()
        };
        globMock = sinon.stub();
        chokidarInstance = {
            add: sinon.stub(),
            on: sinon.stub()
        };
        chokidarMock = {
            watch: sinon.stub().returns(chokidarInstance)
        } ;
        mockery.registerMock('fs-extra', fsMock);
        mockery.registerMock('glob-promise', globMock);
        mockery.registerMock('chokidar', chokidarMock);
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
        var srcPath = 'app/index.html';
        var srcPaths = [srcPath];
        var destPath = 'build/index.html';
        var filesMap = {};
        filesMap[destPath] = srcPaths;
        globMock.withArgs(srcPath).returns(Promise.resolve([srcPath]));
        fsMock.copy.callsArg(2); // make sure promises are resolved
        return copy({files: filesMap}).then(function () {
            test.equal(fsMock.copy.args[0][0], srcPath);
            test.equal(fsMock.copy.args[0][1], destPath);
            test.done();
        }, test.done);
    },

    'should NOT watch files if watch option is not specified': function (test) {
        test.expect(1);
        var copy = require(testPath);
        var srcPath = 'app/index.html';
        var srcPaths = [srcPath];
        var destPath = 'build/index.html';
        var filesMap = {};
        filesMap[destPath] = srcPaths;
        globMock.withArgs(srcPath).returns(Promise.resolve([srcPath]));
        fsMock.copy.callsArg(2); // make sure promises are resolved
        return copy({files: filesMap}).then(function () {
            test.equal(chokidarInstance.add.callCount, 0);
            test.done();
        }, test.done);
    },

    'should watch files if watch option is set to true': function (test) {
        test.expect(1);
        var copy = require(testPath);
        var srcPath = 'app/index.html';
        var srcPaths = [srcPath];
        var destPath = 'build/index.html';
        var filesMap = {};
        filesMap[destPath] = srcPaths;
        globMock.withArgs(srcPath).returns(Promise.resolve([srcPath]));
        fsMock.copy.callsArg(2); // make sure promises are resolved
        return copy({files: filesMap, watch: true}).then(function () {
            test.equal(chokidarInstance.add.args[0][0], srcPath);
            test.done();
        }, test.done);
    },

    'should watch ALL files after all files have been copied': function (test) {
        test.expect(2);
        var copy = require(testPath);
        var srcPath = 'app/index.html';
        var srcPaths = [srcPath];
        var destPath = 'build/index.html';
        var filesMap = {};
        filesMap[destPath] = srcPaths;
        globMock.withArgs(srcPath).returns(Promise.resolve([srcPath]));
        fsMock.copy.callsArg(2); // make sure promises are resolved
        return copy({files: filesMap, watch: true}).then(function () {
            test.equal(chokidarInstance.on.args[0][0], "all");
            test.equal(chokidarInstance.on.callCount, 1);
            test.done();
        }, test.done);
    },

    'should copy files again when one of watched file is updated': function (test) {
        test.expect(5);
        var copy = require(testPath);
        var srcPath = 'app/index.html';
        var srcPaths = [srcPath];
        var destPath = 'build/index.html';
        var filesMap = {};
        filesMap[destPath] = srcPaths;
        globMock.withArgs(srcPath).returns(Promise.resolve([srcPath]));
        fsMock.copy.callsArg(2); // make sure promises are resolved
        var copyCallCount = 0;
        return copy({files: filesMap, watch: true}).then(function () {
            copyCallCount++;
            test.equal(fsMock.copy.args[copyCallCount - 1][0], srcPath);
            test.equal(fsMock.copy.args[copyCallCount - 1][1], destPath);
            test.equal(chokidarInstance.add.args[0][0], srcPath);
            // trigger a watch update on first file
            var logStub = sinon.stub(console, 'log');
            chokidarInstance.on.callArgWith(1, 'changed', srcPath);
            copyCallCount++;
            test.equal(fsMock.copy.args[copyCallCount - 1][0], srcPath);
            test.equal(fsMock.copy.args[copyCallCount - 1][1], destPath);
            logStub.restore();
            test.done();
        }, test.done);
    }


};


