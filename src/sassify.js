let sass = require('node-sass');
let bluebird = require('bluebird');
let _ = require('underscore');
let fs = require('fs-extra');
let path = require("path");
let chokidar = require('chokidar');
let postcss = require('postcss');

let watchFile = function (sourceFile, destinationFile) {
    return new Promise(function (resolve) {
        chokidar.watch(sourceFile, {ignoreInitial: true}).on('all', function (state, src) {
            console.log(src + ' has been updated... sassifying it.');
            sassifyFile(sourceFile, destinationFile, true).then(function () {
                console.log(src + ' has been successfully sassified!');
                resolve();
            });
        });
    });
};

/**
 * Creates the destination directory if it doesnt exist.
 * @param dest
 * @returns {*|exports|module.exports}
 */
let ensureDestinationDir = function (dest) {
    return new Promise(function (resolve, reject) {
        fs.ensureDir(path.dirname(dest), function (err) {
            if (!err) {
                resolve();
            } else {
                reject(err);
            }
        });
    });
};

let sassifyFile = function (sourceFile, destinationFile) {
    return ensureDestinationDir(destinationFile).then(function () {
        return new Promise(function (resolve, reject) {
            sass.render({
                file: sourceFile,
                outFile: destinationFile
            }, function (err, result) {
                if (!err) {
                    // No errors during the compilation, let's write result on the disk
                    fs.writeFile(destinationFile, result.css, function (err) {
                        if (!err) {
                            runPostCss(result.css, destinationFile).then(() => {
                                resolve();
                            });
                        } else {
                            reject(err);
                        }
                    });
                } else {
                    reject(err);
                }
            });
        });
    });
};

let runPostCss = function (css, destFile) {
    return postcss([require('autoprefixer'), require('cssnano')])
        .process(css, {from: destFile, to: destFile})
        .then(function (result) {
            fs.writeFileSync(destFile, result.css);
            if (result.map) {
                fs.writeFileSync(destFile + '.map', result.map);
            }
        });
};

/**
 * Renders a set of scss files into browser-readable css.
 * @param {Object} options
 * @param {Object} options.files - A mapping containing file destination (keys) to the associate set of file bundles (array of values)
 * @param {Boolean} options.watch - Whether to watch the files and rebuild as necessary
 * @returns {Promise} Returns a promise when done writing files
 */
module.exports = function (options) {
    options = _.extend({
        files: {},
        watch: false
    }, options);

    if (!options.files) {
        return Promise.resolve();
    }

    console.log('sassifying all files...');
    let destPaths = _.keys(options.files);
    return bluebird.each(destPaths, function (destPath) {
        // only sass the first main file (all other files should be used as
        // @imports inside of the main file), which is the point of using sass in the first place,
        let sourceFile = options.files[destPath][0];
        return sassifyFile(sourceFile, destPath);
    }).then(function () {
        if (options.watch) {
            return bluebird.each(destPaths, function (destPath) {
                let srcPaths = options.files[destPath];
                return bluebird.each(srcPaths, function (srcPath) {
                    watchFile(srcPath, destPath);
                });
            });
        }
        console.log('done sassifying all files!');
    });

};
