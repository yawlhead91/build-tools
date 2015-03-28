'use strict';
var build = require('./build');
var bump = require('./bump');

module.exports = function(version) {
    return bump(version).then(function () {
        return build(grunt, args);
    });
};
