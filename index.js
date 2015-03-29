'use strict';
var glob = require('glob');
var path = require('path');

var exports = {},
    key;
glob.sync(__dirname + '/src/*.js').forEach(function (p) {
    key = path.basename(p, '.js');
    exports[key] = require('./src/' + key);
});

module.exports = exports;