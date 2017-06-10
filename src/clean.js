'use strict';
let Promise = require('promise');
let fs = require('fs-extra');
/**
 * Removes a directory (and its contents) or file.
 * @param {string|Array} paths - Cleans a path
 * @returns {Promise}
 */
module.exports = function (paths) {
    let promises = [];

    if (!paths || !paths.length) {
        return Promise.resolve();
    }

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