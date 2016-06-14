'use strict';
var testPath = './../src/test';
var sinon = require('sinon');

module.exports = {

    'calling test with a configuration with empty tests resolves immediately': function (test) {
        test.expect(1);
        var cliTest = require(testPath);
        cliTest().then(function () {
            test.ok('true');
            test.done();
        }, test.done);
    },

    'calling test with empty object resolves immediately': function (test) {
        test.expect(1);
        var cliTest = require(testPath);
        cliTest({}).then(function () {
            test.ok('true');
            test.done();
        }, test.done);
    }

};