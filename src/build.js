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
    // run tests first
    return test(config).then(function () {
        return clean(config.dist).then(function () {
            return utils.browserifyFiles(config.build).then(function () {
                return minify({files: config.min.files}).then(function () {
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