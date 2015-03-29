'use strict';
var bt = require('build-tools');

module.exports = function (config, args) {
    args = args || [];
    return bt.test(config, {
        keepalive: args[1] === 'server'
    });
};