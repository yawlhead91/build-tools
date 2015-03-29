'use strict';
var Promise = require('promise');
var fs = require('fs-extra');
var utils = require('./utils');
var uglify = require("uglify-js").minify;
var _ = require('underscore');

/**
 * Uglifies files.
 * @param options
 * @param {Object} options.files - A mapping containing file destination (keys) to the associate set of file bundles (array of values) to minify
 * @returns {Promise}
 */
module.exports = function (options) {
    var result;
    // TODO: this currently only assumes ONE set of files are being uglified, will break if there are more!
    // Change to accommodate multiple bundle building when necessary
    var promises = [];

    if (!options.files) {
        // no files passed!
        return Promise.resolve();
    }

    _.each(options.files, function (srcPaths, destPath) {
        promises.push(new Promise(function (resolve, reject) {
            result = uglify(utils.scopePaths(srcPaths)).code;
            fs.outputFile(utils.scopePaths(destPath), result, function (err) {
                if (err) {
                    console.error(err);
                    reject(err);
                } else {
                    resolve();
                }
            }.bind(this));
        }.bind(this)));
    }.bind(this));

    return Promise.all(promises);
};


