let testPath = './../src/banner';
let sinon = require('sinon');

module.exports = {

    'should resolve immediately when called with no arguments': function (test) {
        test.expect(1);
        let banner = require(testPath);
        banner().then(function () {
            test.ok('true');
            test.done();
        }, test.done);
    },

    'should resolve immediately when called with empty array as first argument': function (test) {
        test.expect(1);
        let banner = require(testPath);
        banner([]).then(function () {
            test.ok('true');
            test.done();
        }, test.done);
    }

};
