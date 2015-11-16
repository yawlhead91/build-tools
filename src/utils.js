'use strict';

var Promise = require('promise');
var _ = require('underscore');
var fs = require('fs-extra');
var glob = require('glob');
var browserify = require('browserify');
var watchify = require('watchify');

module.exports = {

    /**
     * Resolves a relative path to the external project.
     * @param paths
     */
    scopePaths: function (paths) {
        var scope = function (path) {
            return process.cwd() + '/' + path;
        };
        if (typeof paths === 'string') {
            return scope(paths);
        } else {
            return paths.map(function (path) {
                return scope(path);
            });
        }
    }


};