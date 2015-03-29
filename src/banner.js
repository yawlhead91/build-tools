'use strict';

var fs = require('fs-extra');
var glob = require('glob');
var Promise = require('promise');

/**
 * Creates a banner for a set of files.
 * @param {string|Array|glob} files - The src paths or file paths containing files to add banners to
 * @returns {Promise}
 */
module.exports = function (files) {
    var pkg = require(process.cwd() + '/package.json'),
        banner = '/** \n' +
            '* ' + pkg.name + ' - v' + pkg.version + '.\n' +
            '* ' + pkg.repository.url + '\n' +
            '* Copyright ' + new Date().getFullYear() + ' ' + pkg.author.name + '. Licensed MIT.\n' +
            '*/\n';

    var re = null;
    files.forEach(function (globPath) {
        var filePaths = glob.sync(globPath);
        filePaths.forEach( function (src) {
            var fileContents = fs.readFileSync(src, 'utf8');
            if (re && !re.test(fileContents) ) {
                return;
            }
            fs.writeFileSync(src, banner + '\n' + fileContents);
            console.log( 'Banner added to ' + src);
        });
    });
    return Promise.resolve();
};
