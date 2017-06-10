'use strict';
let sinon = require('sinon');
let bumpPath = './../src/bump';
let mockery = require('mockery');

let semVerMock;
let fsMock;

let allowables = [bumpPath, 'underscore', 'promise', 'semver'];

module.exports = {

    setUp: function (cb) {
        mockery.enable({useCleanCache: true});
        mockery.warnOnUnregistered(false); // suppress non-allowed modules
        fsMock = {
            writeFileSync: sinon.stub()
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

    'returns next patch version when no argument is passed': function (test) {
        test.expect(1);
        let version = '0.0.2';
        let config = {version: version};
        mockery.registerMock(process.cwd() + '/package.json', config);
        let bump = require(bumpPath);
        bump().then(function (nextVersion) {
            test.equal(nextVersion, '0.0.3');
            test.done();
        });
    },

    'returns next patch version when "patch" is passed': function (test) {
        test.expect(1);
        let version = '0.0.2';
        let config = {version: version};
        mockery.registerMock(process.cwd() + '/package.json', config);
        let bump = require(bumpPath);
        bump('patch').then(function (nextVersion) {
            test.equal(nextVersion, '0.0.3');
            test.done();
        });
    },

    'returns next minor version when "minor" is passed': function (test) {
        test.expect(1);
        let version = '0.0.2';
        let config = {version: version};
        mockery.registerMock(process.cwd() + '/package.json', config);
        let bump = require(bumpPath);
        bump('minor').then(function (nextVersion) {
            test.equal(nextVersion, '0.1.0');
            test.done();
        });
    },

    'returns next major version when "major" is passed': function (test) {
        test.expect(1);
        let version = '0.0.2';
        let config = {version: version};
        mockery.registerMock(process.cwd() + '/package.json', config);
        let bump = require(bumpPath);
        bump('major').then(function (nextVersion) {
            test.equal(nextVersion, '1.0.0');
            test.done();
        });
    }

};


