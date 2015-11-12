'use strict';
var Promise = require('promise');
var utils = require('./utils');
var test = require('./test');
var banner = require('./banner');
var minify = require('./minify');
var clean = require('./clean');
var server = require('./server');
var _ = require('underscore');
/**
 * Cleans, browserifies, minifies, and creates banners for passed files.
 * @param {Object} [options] - The build configuration
 * @param {String} [options.env] - The unique build environment id
 * @returns {*}
 */
module.exports = function(options) {

    var availableEnvs = new Set(['local', 'prod']);

    if (!options.env) {
        console.warn('no environment was supplied, building prod instead...');
    }
    if (!availableEnvs.has(options.env)) {
        console.warn('there is no environment named ' + options.env + ' building prod instead...');
    }

    options = _.extend({
        env: 'prod'
    }, options);

    if (!options.build) {
        console.warn('nothin\' to build.');
        return Promise.resolve();
    }

    // build with the supplied build property
    options.build = options.build[options.env] || options.build;

    return test(options).then(function () {
        return clean(options.dist).then(function () {
            options.watch = options.env === 'local' || options.watch;
            return utils.browserifyFiles(options).then(function () {
                options.min = options.min || {};
                return minify({files: options.min.files}).then(function () {
                    options.banner = options.banner || {};
                    return banner(options.banner.files).then(function () {
                        console.log('done build!');
                        if (options.env === 'local') {
                            return server();
                        }
                    });
                });
            });
        });
    }).catch(function (err) {
        console.error(err);
    });
};