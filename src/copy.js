'use strict';
let fs = require('fs-extra');
let _ = require('underscore');
let Promise = require('bluebird');
let glob = require('glob-promise');
let path = require('path');
let chokidar = require('chokidar');
let watcher = chokidar.watch([], {ignoreInitial: true});
let async = require('async-promises');

/**
 * Copies files to designated locations.
 * @param {Object} [options] - The copy options
 * @param {Object} [options.files] - A map containing destination paths (keys) with their arrays of source files (values)
 * @param {Boolean} [options.watch] - Whether to watch the files and rebuild as necessary
 * @returns {Promise} Returns a promise when the files are copied
 */
module.exports = function (options) {

    if (!options) {
        return Promise.resolve();
    }

    options = _.extend({
        files: {},
        watch: false
    }, options);

    function ensureDestinationDirectory (dir) {
        return new Promise(function (resolve, reject) {
            fs.ensureDir(path.dirname(dir), function (err) {
                if (err) {
                    reject();
                } else {
                    resolve();
                }
            });
        });
    }

    /**
     * Copies a file into a directory.
     * @param {String} srcPath - source path
     * @param {String} destPath - destination path
     * @returns {Promise} Returns a promise when completed
     */
    function copyFileIntoDirectory(srcPath, destPath) {
        return ensureDestinationDirectory(destPath).then(function () {
            return new Promise(function (resolve, reject) {
                fs.readFile(srcPath, 'utf8', function (err, contents) {
                    if (!err) {
                        resolve();
                    } else {
                        reject(err);
                    }
                    fs.outputFile(destPath + '/' + path.basename(srcPath), contents, function (err) {
                        if (!err) {
                            resolve();
                        } else {
                            reject(err);
                        }
                    });
                });
            });
        });
    }

    /**
     * Copies one path to another one.
     * @param {String} srcPath - source path
     * @param {String} destPath - destination path
     * @returns {Promise} Returns a promise when done
     */
    function copyFile(srcPath, destPath) {
        let srcFileInfo = path.parse(srcPath) || {};
        if (!path.extname(destPath) && srcFileInfo.ext) {
            // destination is a directory!
            return copyFileIntoDirectory(srcPath, destPath);
        } else {
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
    }

    /**
     * Gets the destination path for a source file.
     * @param srcPath
     * @returns {string} Returns the matching destination path
     */
    function getSourceDestinationPath (srcPath) {
        let dests = _.keys(options.files);
        return _.find(dests, function (destPath) {
            let paths = options.files[destPath];
            return _.find(paths, function (p) {
                return p === srcPath || srcPath.indexOf(p) !== -1;
            });
        });
    }

    return Promise.each(Object.keys(options.files), function (destPath) {
        let srcFilePaths = options.files[destPath];
        return Promise.each(srcFilePaths, function (path) {
            return glob(path).then(function (paths) {
                // re-assign new globberred paths
                options.files[destPath] = paths;
                return async.eachSeries(paths, function (p) {
                    return copyFile(p, destPath).then(function () {
                        if (options.watch) {
                            watcher.add(p);
                        }
                    });
                });
            });
        });
    }).then(function () {
        watcher.on('all', (state, srcPath) => {
            if (srcPath) {
                let destPath = getSourceDestinationPath(srcPath);
                console.log('file updated... copying ' + srcPath + ' to ' + destPath);
                copyFile(srcPath, destPath).then(function () {
                    console.log(srcPath + ' has been rebuilt successfully!');
                });
            }
        });
    });
};
