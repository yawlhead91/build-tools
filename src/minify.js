let fs = require('fs-extra');
let utils = require('./utils');
let uglify = require("uglify-js").minify;
let _ = require('underscore');

/**
 * Uglifies files.
 * @param options
 * @param {Object} options.files - A mapping containing file destination (keys) to the associate set of file bundles (array of values) to minify
 * @returns {Promise}
 */
module.exports = function (options) {
    let result;
    // TODO: this currently only assumes ONE set of files are being uglified, will break if there are more!
    // Change to accommodate multiple bundle building when necessary
    let promises = [];

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


