'use strict';
var sinon = require('sinon');
var mockery = require('mockery');
var Promise = require("promise");
var serverMock;
var serverConstructor;
var allowables = ['nopt', './../src/utils', 'path', 'underscore'];

module.exports = {

    setUp: function (cb) {
        mockery.enable({useCleanCache: true});
        mockery.warnOnUnregistered(false); // suppress non-allowed modules
        mockery.registerAllowables(allowables);
        serverMock = {
            start: sinon.stub().returns(Promise.resolve())
        };
        serverConstructor = sinon.stub().returns(serverMock);
        mockery.registerMock('./../src/server', serverConstructor);
        cb();
    },

    tearDown: function (cb) {
        mockery.deregisterAll();
        mockery.disable();
        cb();
    },

    'should call server with no options when no config options are passed': function (test) {
        test.expect(2);
        var server = require('./../cli/server');
        server().then(function () {
            test.equal(serverConstructor.callCount, 1);
            test.ok(!serverConstructor.args[0][0]);
            test.done();
        });
    },

};
