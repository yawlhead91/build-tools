"use strict";
var sass = require('node-sass');
var Promise = require('promise');
var _ = require('underscore');
var fs = require('fs-extra');
var path = require("path");

var watchFile = function (sourceFile, destinationFile) {
    return new Promise(function (resolve) {
        fs.watch(sourceFile, function () {
            resolve(sassifyFile(sourceFile, destinationFile, true));
        });
    });
};

/**
 * Creates the destination directory if it doesnt exist.
 * @param dest
 * @returns {*|exports|module.exports}
 */
var ensureDestinationDir = function (dest) {
    return new Promise(function (resolve, reject) {
        fs.ensureDir(path.dirname(dest), function (err) {
            if (!err) {
                resolve();
            } else {
                reject(err);
            }
        });
    });
};

var sassifyFile = function (sourceFile, destinationFile, watch) {
    return ensureDestinationDir(destinationFile).then(function () {
        return new Promise(function (resolve, reject) {
            sass.render({
                file: sourceFile,
                outFile: destinationFile
            }, function (err, result) {
                if (!err) {
                    // No errors during the compilation, let's write result on the disk
                    fs.writeFile(destinationFile, result.css, function (err) {
                        if (!err) {
                            if (watch) {
                                watchFile(sourceFile, destinationFile);
                            }
                            resolve();
                        } else {
                            reject(err);
                        }
                    });
                } else {
                    reject(err);
                }
            });
        });
    });
};

/**
 * Renders a set of scss files into browser-readable css.
 * @param {Object} options
 * @param {Object} options.files - A mapping containing file destination (keys) to the associate set of file bundles (array of values)
 * @param {Boolean} options.watch - Whether to watch the files and rebuild as necessary
 * @returns {Promise} Returns a promise when done writing files
 */
module.exports = function (options) {
    var promises = [];
    options = _.extend({
        files: [],
        watch: false
    }, options);

    if (!options.files) {
        return Promise.resolve();
    }

    console.log('sassifying all files...');
    _.each(options.files, function (srcPaths, destPath) {
        // only sass the first main file (all other files should be used as
        // @imports inside of the main file), which is the point of using sass in the first place,
        promises.push(sassifyFile(srcPaths[0], destPath, options.watch));
    });
    return Promise.all(promises).then(function () {
        console.log('done sassifying all files!');
    });

};