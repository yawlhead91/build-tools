'use strict';

var Promise = require('promise');
var _ = require('underscore');
var fs = require('fs-extra');
var glob = require('glob');
var browserify = require('browserify');
var watchify = require('watchify');
var utils = require('./utils');
var path = require("path");
var envify = require('envify/custom');

/**
 * Browserifies a single file bundle.
 * @param destPath
 * @param srcPaths
 * @param options
 * @param {Object|Array} [options.requires] - Required files
 * @returns {Promise}
 */
var browserifyFile = function (destPath, srcPaths, options) {
    var stream,
        b,
        finalPaths = [];
    return new Promise(function (resolve, reject) {
        _.each(srcPaths, function (path) {
            // deal with file globs
            if (glob.hasMagic(path)) {
                glob.sync(path).forEach((p) => {
                    p = utils.scopePaths(p);
                    finalPaths.push(p);
                });
            } else {
                path = utils.scopePaths(path);
                finalPaths.push(path);
            }
        }.bind(this));

        // add required parameters for watchify
        options.cache = {};
        options.packageCache = {};

        options.debug = options.watch;

        b = browserify(options);

        b.transform(envify({
            _: 'purge',
            NODE_ENV: options.env
        }), {global: true});

        // must add each path individual unfortunately.
        finalPaths.forEach(function (path) {
            b.add(path);
        }.bind(this));

        options.ignore.forEach((file) => {
            b.ignore(file);
        });
        options.exclude.forEach((file) => {
            b.exclude(file);
        });

        // require global files
        _.each(options.requires, function (path, id) {
            // options.requires can be an array of strings or an object
            id = typeof id == "string" ? id : path;
            b.require(path, {expose: id});
        });

        if (options.watch) {
            b.plugin(watchify);
            // re-bundle when updated
            b.on('update', function () {
                console.log('file updated!');
                b.bundle();
            });
        }


        b.on('bundle', function (stream) {
            console.log('browserifying bundle...');
            writeBrowserifyBundleStreamToFile(stream, destPath)
                .then(function () {
                    console.log('done browserifying bundle!');
                    resolve();
                })
                .catch(function (e) {
                    console.log('browserifying failed');
                    console.log(e);
                    reject(e);
                });
        });

        stream = b.bundle();

    }.bind(this));
};

/**
 * Handles writing the browserify bundle stream to the destination file.
 * @param {EventEmitter} stream - The bundle stream
 * @param {string} destPath - The destination file
 * @private
 */
var writeBrowserifyBundleStreamToFile = function (stream, destPath) {
    var data = '';
    return new Promise(function (resolve, reject) {
        stream.on('error', reject);
        stream.on('data', function (d) {
            data += d.toString();
        });
        stream.on('end', function () {
            fs.outputFile(destPath, data, function (err) {
                if (!err) {
                    resolve();
                } else {
                    reject(err);
                }
            });
        });
    });
};

/**
 * Browserifies a set of files.
 * @param {Object} options - Options that will be passed to browserify instance (most of these are the same as Browserify opts at https://github.com/substack/node-browserify#browserifyfiles--opts)
 * @param {Object} options.files - A mapping containing file destination (keys) to the associate set of file bundles (array of values)
 * @param {Object} [options.requires] - A id-url map object of global browserify requires
 * @param {Array} [options.plugins] - An array of browserify plugins options
 * @param {Array} [options.transform] - An array of browserify transforms options
 * @param {Array} [options.ignore] - An array of package names or require refs to ignore
 * @param {Array} [options.exclude] - An array of package names or require refs to exclude from the bundle
 * @returns {Promise} Returns a promise when complete
 */
module.exports = function (options) {

    var promises = [];

    options = _.extend({
        files: null,
        requires: [],
        plugins: [],
        transform: [],
        ignore: [],
        exclude: [],
    }, options);

    if (!options.files) {
        return Promise.resolve();
    }

    console.log('browserifyin all files...');
    _.each(options.files, function (srcPaths, destPath) {
        promises.push(browserifyFile(destPath, srcPaths, options));
    });
    return Promise.all(promises).then(function () {
        console.log('done browserifying all files!');
    });

};
