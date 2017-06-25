'use strict';
let sinon = require('sinon');
let mockery = require('mockery');
let serverMock;
let serverConstructor;
let utilsMock;
let allowables = [
    'nopt',
    'path',
];

module.exports = {

    setUp: function (cb) {
        mockery.enable({useCleanCache: true});
        mockery.warnOnUnregistered(false); // suppress non-allowed modules
        mockery.registerAllowables(allowables);
        serverMock = {
            start: sinon.stub().returns(Promise.resolve())
        };
        utilsMock = {
            getConfig: sinon.stub()
        };
        mockery.registerMock('./../src/utils', utilsMock);
        serverConstructor = sinon.stub().returns(serverMock);
        mockery.registerMock('./../src/server', serverConstructor);
        cb();
    },

    tearDown: function (cb) {
        mockery.deregisterAll();
        mockery.disable();
        cb();
    },

    'should NOT call server when no config options are passed and no options are in config file': function (test) {
        test.expect(1);
        let server = require('./../cli/server');
        server().then(function () {
            test.equal(serverConstructor.callCount, 0);
            test.done();
        });
    },

    'should call server with root level config server options in config file when no arguments are passed': function (test) {
        test.expect(4);
        let mockConfig = {
            server: {
                hostname: 'beep',
                staticDir: './bop',
                middleware: './bloop.js',
                port: 23
            }
        };
        utilsMock.getConfig.returns(mockConfig);
        let server = require('./../cli/server');
        server().then(function () {
            let assertedServerOptions = serverConstructor.args[0][0];
            test.equal(assertedServerOptions.hostname, 'beep');
            test.equal(assertedServerOptions.staticDir, './bop');
            test.equal(assertedServerOptions.middleware, './bloop.js');
            test.equal(assertedServerOptions.port, 23);
            test.done();
        });
    },

    'should call server with production level config server options in config file when no arguments are passed': function (test) {
        test.expect(4);
        let mockConfig = {
            production: {
                server: {
                    hostname: 'beep',
                    staticDir: './bop',
                    middleware: './bloop.js',
                    port: 23
                }
            }
        };
        utilsMock.getConfig.returns(mockConfig);
        let server = require('./../cli/server');
        server().then(function () {
            let assertedServerOptions = serverConstructor.args[0][0];
            test.equal(assertedServerOptions.hostname, 'beep');
            test.equal(assertedServerOptions.staticDir, './bop');
            test.equal(assertedServerOptions.middleware, './bloop.js');
            test.equal(assertedServerOptions.port, 23);
            test.done();
        });
    },

    'should call server with custom config server options in config file when no arguments are passed': function (test) {
        test.expect(4);
        let mockConfig = {
            myCustomEnv: {
                server: {
                    hostname: 'beep',
                    staticDir: './bop',
                    middleware: './bloop.js',
                    port: 23
                }
            }
        };
        utilsMock.getConfig.returns(mockConfig);
        let server = require('./../cli/server');
        server(['myCustomEnv']).then(function () {
            let assertedServerOptions = serverConstructor.args[0][0];
            test.equal(assertedServerOptions.hostname, 'beep');
            test.equal(assertedServerOptions.staticDir, './bop');
            test.equal(assertedServerOptions.middleware, './bloop.js');
            test.equal(assertedServerOptions.port, 23);
            test.done();
        });
    },

};
