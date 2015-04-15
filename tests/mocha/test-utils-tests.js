'use strict';
var TestUtils = require('./../../src/test/test-utils');
var assert = require('assert');
var sinon = require('sinon');


describe('Test Utils', function () {

    it('createHtmlElement() creates an HTMLElement', function () {
        var html = '<div class="my-element"></div>';
        var element = TestUtils.createHtmlElement(html);
        assert.equal(element.outerHTML, html, 'element was created with correct html');
    });

});