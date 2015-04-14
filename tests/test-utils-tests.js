'use strict';
var TestUtils = require('./../src/test/test-utils');
var assert = require('assert');
var sinon = require('sinon');


describe('Test Utils', function () {

    it('createPromise() should return a promise that can be resolved', function () {
        var promise = TestUtils.createPromise();
        var cb = sinon.spy();
        promise.then(cb);
        assert.equal(cb.callCount, 0, 'resolved callback is not fired initially');
        promise.resolve();
        assert.equal(cb.callCount, 1, 'callback is fired when promise resolves');
    });

});