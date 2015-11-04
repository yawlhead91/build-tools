'use strict';
var Promise = require('promise');
var utils = require('./utils');
var test = require('./test');
var banner = require('./banner');
var minify = require('./minify');
var clean = require('./clean');
/**
 * Cleans, browserifies, minifies, and creates banners for passed files.
 * @param config
 * @returns {*}
 */
module.exports = function(config) {

    config = config || {};

    if (!config.build) {
        console.warn('nothin\' to build.');
        return Promise.resolve();
    }

    // build with the supplied build property
    config.build = config.build['local'] || config.build['prod'] || config.build;

    return test(config).then(function () {
        return clean(config.dist).then(function () {
            return utils.browserifyFiles(config.build).then(function () {
                config.min = config.min || {};
                return minify({files: config.min.files}).then(function () {
                    config.banner = config.banner || {};
                    return banner(config.banner.files).then(function () {
                        console.log('done build!');
                    });
                });
            });
        });
    }).catch(function (err) {
        console.error(err);
    });
};