let sinon = require('sinon');
let deployPath = './../src/deploy';
let mockery = require('mockery');

let globMock;
let scp2ClientMock;
let fsMock;
let isDirectoryMock;
let scp2Constructor;

let allowables = ['util', deployPath, 'underscore', 'async-promises', 'path'];

module.exports = {

    setUp: function (cb) {
        mockery.enable({useCleanCache: true});
        mockery.warnOnUnregistered(false); // suppress non-allowed modules
        scp2ClientMock = {
            mkdir: sinon.stub(),
            upload: sinon.stub()
        };
        scp2Constructor = sinon.stub();
        mockery.registerMock('scp2', {
            Client: scp2Constructor.returns(scp2ClientMock)
        });
        isDirectoryMock = sinon.stub();
        fsMock = {
            statSync: sinon.stub().returns({
                isDirectory: isDirectoryMock
            }),
            existsSync: sinon.stub()
        };
        mockery.registerMock('fs', fsMock);
        globMock = sinon.stub().returns(Promise.resolve());
        mockery.registerMock('glob-promise', globMock);
        mockery.registerAllowables(allowables);
        // don't print to console
        sinon.stub(console, 'error');
        sinon.stub(console, 'log');

        cb();
    },

    tearDown: function (cb) {
        mockery.deregisterAll();
        mockery.disable();
        console.error.restore();
        console.log.restore();
        cb();
    },

    'should reject if no hostname is supplied': function (test) {
        test.expect(1);
        let deploy = require(deployPath);
        deploy().catch(function (err) {
            test.ok(err);
            test.done();
        });
    },

    'should reject if a protocol is passed that is NOT "sftp"': function (test) {
        test.expect(1);
        let deploy = require(deployPath);
        deploy({
            hostname: '55.55.555.55',
            protocol: 'blah'
        }).catch(function (err) {
            test.ok(err);
            test.done();
        });
    },

    'should reject if "path" option points to a directory that doesnt exist': function (test) {
        test.expect(1);
        let deploy = require(deployPath);
        let testPath = 'test/path';
        fsMock.existsSync.withArgs(testPath).returns(false);
        deploy({
            hostname: '55.55.555.55',
            path: testPath
        }).catch(function (err) {
            test.ok(err);
            test.done();
        });
    },

    'should pass correct options to scp2 client': function (test) {
        test.expect(4);
        let deploy = require(deployPath);
        let testPath = 'test/path';
        fsMock.existsSync.withArgs(testPath).returns(true);
        deploy({
            hostname: '55.55.555.55',
            path: testPath,
            username: 'bob',
            password: 'secret'
        }).then(function () {
            let args = scp2Constructor.args[0][0];
            test.equal(args.host, '55.55.555.55');
            test.equal(args.path, testPath);
            test.equal(args.username, 'bob');
            test.equal(args.password, 'secret');
            test.done();
        });

    }

};


