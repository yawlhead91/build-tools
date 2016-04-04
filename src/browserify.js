'use strict';

var Promise = require('promise');
var _ = require('underscore');
var fs = require('fs-extra');
var glob = require('glob');
var browserify = require('browserify');
var watchify = require('watchify');
var utils = require('./utils');
var babelify = require("babelify");
var path = require("path");
var es2015 = require('babel-preset-es2015');
var stage0 = require('babel-preset-stage-0');

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
        // deal with file globs
        _.each(srcPaths, function (path) {
            if (glob.hasMagic(path)) {
                path = glob.sync(path);
            }
            path = utils.scopePaths(path);
            finalPaths.push(path);
        }.bind(this));

        // merge custom browserify options if exist
        options.browserifyOptions = _.extend({}, options.browserifyOptions);

        // add required parameters for watchify
        options.browserifyOptions.cache = {};
        options.browserifyOptions.packageCache = {};

        b = browserify(options.browserifyOptions);

        // must add each path individual unfortunately.
        finalPaths.forEach(function (path) {
            b.add(path);
        }.bind(this));

        // require global files
        _.each(options.requires, function (path, id) {
            // options.requires can be an array of strings or an object
            id = typeof id == "string" ? id : path;
            b.require(path, {expose: id});
        });
        b.transform(babelify, {
            presets: [es2015, stage0],
            global: true,
            // must whitelist modules that are using the latest es2015/babelify to
            // ensure they are transpiled when build is run
            ignore: /\/node_modules\/(?!module-js|router-js\/)/
        });

        if (options.watch) {
            b = watchify(b);
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
 * @param {Object} options
 * @param {Object} options.files - A mapping containing file destination (keys) to the associate set of file bundles (array of values)
 * @param {Object} [options.requires] - A id-url map object of global requires
 * @param {Object} [options.browserifyOptions] - Options that will be passed to browserify instance
 * @returns {Promise} Returns a promise when complete
 */
module.exports = function (options) {

    var promises = [];

    options = _.extend({
        requires: []
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
