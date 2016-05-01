'use strict';
var sinon = require('sinon');
var serverPath = './../../src/server';
var mockery = require('mockery');

var expressMock;
var httpMock;
var Server;
var expressConstructorMock;
var serverMock;

var allowables = ['util', serverPath, 'promise', 'underscore'];

module.exports = {

    setUp: function (cb) {
        mockery.enable({useCleanCache: true});
        mockery.warnOnUnregistered(false); // suppress non-allowed modules
        expressMock = {
            use: sinon.stub()
        };
        expressConstructorMock = sinon.stub();
        expressConstructorMock.returns(expressMock);
        mockery.registerMock('express', expressConstructorMock);
        serverMock = {
            close: sinon.stub(),
            listen: sinon.stub(),
            on: sinon.stub()
        };
        httpMock = {
            createServer: sinon.stub().returns(serverMock)
        };
        mockery.registerMock('http', httpMock);
        mockery.registerAllowables(allowables);
        Server = require(serverPath);
        cb();
    },

    tearDown: function (cb) {
        mockery.deregisterAll();
        mockery.disable();
        cb();
    },

    'should pass express instance to createServer on instantiation': function (test) {
        test.expect(1);
        var server = new Server();
        test.deepEqual(httpMock.createServer.args[0][0], expressMock);
        test.done();
    },

    'should pass the express instance to the middleware function in options on instantiation': function (test) {
        test.expect(1);
        var myMiddleware = sinon.spy();
        var server = new Server({middleware: myMiddleware});
        test.deepEqual(myMiddleware.args[0][0], expressMock);
        test.done();
    },

    'should call listen method with default port of 7000 on server instance when starting': function (test) {
        test.expect(1);
        var server = new Server();
        server.start().then(function () {
            test.deepEqual(serverMock.listen.args[0][0], 7000);
            test.done();
        }, test.done);
    },

    'should call listen method with port specified in options to server instance when starting': function (test) {
        test.expect(1);
        var server = new Server({port: 8});
        server.start().then(function () {
            test.deepEqual(serverMock.listen.args[0][0], 8);
            test.done();
        }, test.done);
    }

};


