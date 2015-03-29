'use strict';
var test = require('./../src/test');

module.exports = function (config, args) {
    args = args || [];
    return test(config, {
        keepalive: args[1] === 'server'
    });
};