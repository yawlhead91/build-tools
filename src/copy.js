'use strict';
var fs = require('fs-extra');
var _ = require('underscore');
var Promise = require('promise');
var glob = require('glob');
var path = require('path');
var chokidar = require('chokidar');

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
     * Returns a set of paths based on a glob string
     * @param {string} srcGlob - The glob string
     * @returns {Promise} Returns a promise with the array of paths that match
     */
    function getGlobs (srcGlob) {
        return new Promise(function (resolve, reject) {
            // if the path is not a glob pattern, just return it
            if (!glob.hasMagic(srcGlob)) {
                return resolve([srcGlob]);
            }
            glob(srcGlob, function (err, paths) {
                if (err) {
                    reject(err);
                } else {
                    resolve(paths);
                }
            })
        });
    }


    /**
     * Copies a set of files to a destination.
     * @param {Array} srcFilePaths - source path(s) (can contain globs)
     * @param {string} destPath - the destination
     * @param {boolean} [watch] - Whether to watch the file
     * @returns {Promise}
     */
    function copyFiles(srcFilePaths, destPath, watch) {

        // ensure it is an array
        if (!Array.isArray(srcFilePaths)) {
            srcFilePaths = [srcFilePaths];
        }

        return srcFilePaths.reduce(function (prevPromise, srcGlob) {
            return prevPromise.then(function () {
                return getGlobs(srcGlob).then(function (paths) {
                    return paths.reduce(function (prev, p) {
                        return prev.then(function () {
                            return copyFile(p, destPath).then(function () {
                                if (watch) {
                                    watchFile(p, destPath);
                                }
                            });
                        });
                    }, Promise.resolve())
                });
            });
        }, Promise.resolve());

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
        var srcFileInfo = path.parse(srcPath) || {};
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
     * Watches a file and rebuilds if updated.
     * @param srcPath
     * @param destPath
     */
    function watchFile(srcPath, destPath) {
        chokidar.watch(srcPath, {persistent: true}).on('all', () => {
            console.log("file updated... rebuilding...");
            copyFile(srcPath, destPath).then(function () {
                console.log("file built");
            });
        });
    }

    var destPaths = _.keys(options.files);
    return destPaths.reduce(function (prevPromise, key) {
        return prevPromise.then(function () {
            return copyFiles(options.files[key], key, options.watch);
        });
    }, Promise.resolve());
};
