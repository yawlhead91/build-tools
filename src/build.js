let utils = require('./utils');
let banner = require('./banner');
let minify = require('./minify');
let Server = require('./server');
let _ = require('underscore');
let copy = require('./copy');
let browserify = require('./browserify');
let path = require('path');
let sassify = require('./sassify');

/**
 * Browserifies, minifies, and creates banners for passed files.
 * @param {Object} [options] - The build configuration
 * @param {String} [options.env] - The unique build environment id
 * @param {Object} [options.files] - An object containg a file mapping of the files to build
 * @param {String} [options.browserifyOptions] - The browserify options
 * @param {String} [options.middleware] - The path to middleware file when server is started (when env is 'local')
 * @param {String} [options.port] - The port to start server on (when env is 'local')
 * @param {String} [options.watch] - Whether to watch the files  (useful for development)
 * @param {String} [options.staticDir] - The directory to serve static files
 * @param {Object|Array} [options.requires] - Required files
 * @param {Array} [options.exclude] - Excluded files
 * @param {Array} [options.ignore] - Ignored files
 * @returns {*}
 */
    module.exports = function(options) {

        options = options || {};

        if (!options.files) {
            console.warn('no files to build.');
            return Promise.resolve();
        }

        console.log('Building ' + options.env + ' environment...');

        options = _.extend({
            env: '',
            files: null,
            minifyFiles: null,
            bannerFiles: null,
            watch: options.env === 'local',
            staticDir: null,
            requires: null,
            browserifyOptions: {}
        }, options);

        options.browserifyOptions.debug = options.browserifyOptions.debug || options.env === 'local';

        let browserifyOptions = _.extend({}, options.browserifyOptions, options);
        // to restrict so that only JS files are passed into browserify,
        browserifyOptions.files = {};
        let copyOptions = {files: {}, watch: options.watch},
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
        }).catch(function (err) {
            console.error(err);
        });
};
