'use strict';
let sinon = require('sinon');
let bumpPath = './../src/bump';
let mockery = require('mockery');

let fsMock;
let packageJSONMock;
let packageLockJSONMock;

let allowables = [bumpPath, 'underscore', 'promise', 'semver'];

module.exports = {

    setUp: function (cb) {
        mockery.enable({useCleanCache: true});
        mockery.warnOnUnregistered(false); // suppress non-allowed modules
        fsMock = {
            writeFileSync: sinon.stub()
        };
        mockery.registerMock('fs-extra', fsMock);
        packageJSONMock = {};
        mockery.registerMock(process.cwd() + '/package.json', packageJSONMock);
        packageLockJSONMock = {};
        mockery.registerMock(process.cwd() + '/package-lock.json', packageLockJSONMock);
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
        packageJSONMock.version = '0.0.2';
        let bump = require(bumpPath);
        bump().then(function (nextVersion) {
            test.equal(nextVersion, '0.0.3');
            test.done();
        });
    },

    'returns next patch version when "patch" is passed': function (test) {
        test.expect(1);
        packageJSONMock.version = '0.0.2';
        let bump = require(bumpPath);
        bump('patch').then(function (nextVersion) {
            test.equal(nextVersion, '0.0.3');
            test.done();
        });
    },

    'returns next minor version when "minor" is passed': function (test) {
        test.expect(1);
        packageJSONMock.version = '0.0.2';
        let bump = require(bumpPath);
        bump('minor').then(function (nextVersion) {
            test.equal(nextVersion, '0.1.0');
            test.done();
        });
    },

    'returns next major version when "major" is passed': function (test) {
        test.expect(1);
        packageJSONMock.version = '0.0.2';
        let bump = require(bumpPath);
        bump('major').then(function (nextVersion) {
            test.equal(nextVersion, '1.0.0');
            test.done();
        });
    },

    'updates package-lock.json file with new version': function (test) {
        test.expect(2);
        packageLockJSONMock.version = '0.0.2';
        let bump = require(bumpPath);
        bump().then(() => {
            let args = fsMock.writeFileSync.args[0];
            let filePath = args[0];
            let fileContentVersion = JSON.parse(args[1]).version;
            test.equal(fileContentVersion, '0.0.3');
            test.equal(filePath, 'package-lock.json');
            test.done();
        });
    }


};


