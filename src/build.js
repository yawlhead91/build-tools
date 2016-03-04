'use strict';
var Promise = require('promise');
var utils = require('./utils');
var banner = require('./banner');
var minify = require('./minify');
var clean = require('./clean');
var server = require('./server');
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
 * @param {String} [options.staticDir] - The directory to serve static files
 * @returns {*}
 */
module.exports = function(options) {

    var availableEnvs = new Set(['local', 'prod']);

    options = options || {};


    // account for deprecated 'min' property
    options.minifyFiles = options.min ? options.min.files : options.minifyFiles;
    // account for deprecated 'banner' property
    options.bannerFiles = options.banner ? options.banner.files : options.bannerFiles;
    options.files = options.build ? options.build.files : options.files;
    
    if (!options.env) {
        console.warn('no environment was supplied, building prod instead...');
    } else if (!availableEnvs.has(options.env)) {
        console.warn('there is no environment named ' + options.env + ' building prod instead...');
    }

    if (!options.dist) {
        console.warn('um, no distribution folder was specified to build into.');
        return Promise.resolve();
    } else if (!options.files) {
        console.warn('no files to build.');
        return Promise.resolve();
    }

    options = _.extend({
        env: 'prod',
        files: null,
        dist: null,
        minifyFiles: null,
        bannerFiles: null,
        staticDir: null,
        browserifyOptions: {}
    }, options);

    options.watch = options.env === 'local';
    options.browserifyOptions.debug = options.browserifyOptions.debug || options.env === 'local';

    return clean(options.dist).then(function () {
        var browserifyOptions = {
            watch: options.watch,
            browserifyOptions: options.browserifyOptions,
            files: {},
            requires: options.requires
        };
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
                    options.min = options.min || {};
                    return minify({files: options.minifyFiles}).then(function () {
                        return banner(options.bannerFiles).then(function () {
                            console.log('done build!');
                            if (options.env === 'local') {
                                return server(options);
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