'use strict';
var sinon = require('sinon');
var mockery = require('mockery');
var Promise = require("promise");
var releasePath = './../cli/release';
var testMock, buildMock, bumpMock, versionMock;
var allowables = ['./../../cli/release'];

module.exports = {

    setUp: function (cb) {
        mockery.enable({useCleanCache: true});
        mockery.warnOnUnregistered(false); // suppress non-allowed modules
        mockery.registerAllowables(allowables);
        testMock = sinon.stub().returns(Promise.resolve());
        bumpMock = sinon.stub().returns(Promise.resolve());
        buildMock = sinon.stub().returns(Promise.resolve());
        versionMock = sinon.stub().returns(Promise.resolve());
        mockery.registerMock('./test', testMock);
        mockery.registerMock('./../src/bump', bumpMock);
        mockery.registerMock('./build', buildMock);
        mockery.registerMock('./../src/version', versionMock);
        cb();
    },

    tearDown: function (cb) {
        mockery.deregisterAll();
        mockery.disable();
        cb();
    },

    'should run tests': function (test) {
        test.expect(1);
        var release = require(releasePath);
        release(['patch']).then(function () {
            test.equal(testMock.callCount, 1);
            test.done();
        });
    },

    'should pass first argument (version type) to bump': function (test) {
        test.expect(1);
        var release = require(releasePath);
        var type = 'patch';
        release([type]).then(function () {
            test.deepEqual(bumpMock.args[0], [type]);
            test.done();
        });
    },

    'should pass prod and test argument that is false to build function': function (test) {
        test.expect(1);
        var release = require(releasePath);
        release().then(function () {
            test.deepEqual(buildMock.args[0][0], ['prod', '--test=false']);
            test.done();
        });
    },

    'should pass updated version number from bump to version function': function (test) {
        test.expect(1);
        var newVersionNbr = "9.95.0";
        bumpMock = sinon.stub().returns(Promise.resolve(newVersionNbr));
        mockery.registerMock('./../src/bump', bumpMock);
        var release = require(releasePath);
        release().then(function () {
            test.deepEqual(versionMock.args[0], [newVersionNbr]);
            test.done();
        });
    }

};