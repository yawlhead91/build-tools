'use strict';
let glob = require('glob');
let path = require('path');

let exports = {},
    key;
glob.sync(__dirname + '/src/*.js').forEach(function (p) {
    key = path.basename(p, '.js');
    exports[key] = require('./src/' + key);
});

module.exports = exports;