'use strict';
var Promise = require('promise');
var utils = require('./utils');
var banner = require('./banner');
var minify = require('./minify');
var clean = require('./clean');
var Server = require('./server');
var _ = require('underscore');
var copy = require('./copy');
var browserify = require('./browserify');
var path = require('path');
var sassify = require('./sassify');

/**
 * Cleans, browserifies, minifies, and creates banners for passed files.
 * @param {Object} [options] - The build configuration
 * @param {String} [options.env] - The unique build environment id
 * @param {Object} [options.files] - An object containg a file mapping of the files to build
 * @param {String} [options.dist] - The destination folder of where the the files will be built
 * @param {String} [options.browserifyOptions] - The browserify options
 * @param {String} [options.middleware] - The path to middleware file when server is started (when env is 'local')
 * @param {String} [options.port] - The port to start server on (when env is 'local')
 * @param {String} [options.watch] - Whether to watch the files  (useful for development)
 * @param {String} [options.staticDir] - The directory to serve static files
 * @param {Object|Array} [options.requires] - Required files
 * @returns {*}
 */
module.exports = function(options) {

    var availableEnvs = new Set(['local', 'production']);

    options = options || {};


    // account for deprecated 'min' property
    options.minifyFiles = options.min ? options.min.files : options.minifyFiles;
    // account for deprecated 'banner' property
    options.bannerFiles = options.banner ? options.banner.files : options.bannerFiles;
    options.files = options.build ? options.build.files : options.files;

    // support legacy 'prod' environment
    if (options.env === 'prod') {
        console.warn('"prod" environment variable is deprecated and will be removed in next major release, please use "production" instead');
        options.env = 'production';
    }

    if (!options.env) {
        console.warn('no environment was supplied, building production instead...');
        options.env = 'production';
    } else if (!availableEnvs.has(options.env)) {
        console.warn('there is no environment named ' + options.env + ' building prod instead...');
    }

    if (!options.files) {
        console.warn('no files to build.');
        return Promise.resolve();
    }

    console.log('Building ' + options.env + ' environment...');

    options = _.extend({
        env: process.env.NODE_ENV,
        files: null,
        dist: null,
        minifyFiles: null,
        bannerFiles: null,
        watch: options.env === 'local',
        staticDir: null,
        requires: null,
        browserifyOptions: {}
    }, options);

    options.browserifyOptions.debug = options.browserifyOptions.debug || options.env === 'local';

    return clean(options.dist).then(function () {
        var browserifyOptions = _.extend({}, options.browserifyOptions, {
            watch: options.watch,
            files: {},
            requires: options.requires,
            env: options.env
        });
        var copyOptions = {files: {}, watch: options.watch},
            sassOptions = {files: {}, watch: options.watch};
        // only copy only non-js files
        _.each(options.files, function (srcPaths, destPath) {
            if (path.extname(destPath) === '.css') {
                sassOptions.files[destPath] = srcPaths;
            } else if (path.extname(destPath) === '.js') {
                browserifyOptions.files[destPath] = srcPaths;
            } else {
                copyOptions.files[destPath] = srcPaths;
            }
        });
        return copy(copyOptions).then(function () {
            return sassify(sassOptions).then(function () {
                return browserify(browserifyOptions).then(function () {
                    return minify({files: options.minifyFiles}).then(function () {
                        return banner(options.bannerFiles).then(function () {
                            console.log('Successfully completed a ' + options.env + ' build!');
                            if (options.env === 'local') {
                                return new Server(options).start();
                            }
                        });
                    });
                });
            });
        });
    }).catch(function (err) {
        console.error(err);
    });
};
