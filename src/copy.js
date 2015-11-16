'use strict';
var fs = require('fs-extra');
var _ = require('underscore');
var Promise = require('promise');

/**
 * Copies files to designated locations.
 * @param {Object} [options] - The copy options
 * @param {Object} [options.files] - A map containing destination paths (keys) with their arrays of source files (values)
 * @returns {Promise} Returns a promise when the files are copied
 */
module.exports = function (options) {

    if (!options) {
        return Promise.resolve();
    }

    options = _.extend({
        files: {}
    }, options);


    /**
     * Copies a set of files to a destination.
     * @param srcFilePaths
     * @param destPath
     * @returns {Promise}
     */
    function copyFiles(srcFilePaths, destPath) {

        // ensure it is an array
        if (!Array.isArray(srcFilePaths)) {
            srcFilePaths = [srcFilePaths];
        }

        return srcFilePaths.reduce(function (prevPromise, path) {
            return prevPromise.then(function () {
                return copyFile(path, destPath);
            });
        }, Promise.resolve());
    }

    /**
     * Copies one path to another one.
     * @param {String} srcPath - source path
     * @param {String} destPath - destination path
     * @returns {Promise} Returns a promise when done
     */
    function copyFile(srcPath, destPath) {
        return new Promise(function (resolve, reject) {
            fs.copy(srcPath, destPath, function (err) {
                if (!err) {
                    resolve();
                } else {
                    reject(err);
                }
            });
        });
    }

    var destPaths = _.keys(options.files);

    return destPaths.reduce(function (prevPromise, key) {
        return prevPromise.then(function () {
            return copyFiles(options.files[key], key);
        });
    }, Promise.resolve());
};