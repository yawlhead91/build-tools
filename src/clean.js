'use strict';
var Promise = require('promise');
var fs = require('fs-extra');
/**
 * Removes a directory (and its contents) or file.
 * @param {string|Array} paths - Cleans a path
 * @returns {Promise}
 */
module.exports = function (paths) {
    var promises = [];

    if (typeof paths === 'string') {
        paths = [paths];
    }
    paths.forEach(function (p) {
        promises.push(new Promise(function (resolve, reject) {
            fs.remove(p, function (err) {
                if (err) {
                    console.error(err);
                    reject(err);
                } else {
                    resolve();
                }
            });
        }));
    });

    return Promise.all(promises);
};