"use strict";
var fs = require('fs-extra');
var editor = require('editor');

const DEFAULT_GUIDANCE_TEXT = '\n' +
    '\n' +
    '# Please enter your commit message above.\n' +
    '# These lines will be ignored.';

/**
 * Prompts the user for a message in default editor and then returns what they've typed in the editor.
 * @param {Object} [options] - a set of options
 * @param {String} [options.defaultText] - a set of default text already populated in the editor
 * @param {String} [options.guidanceText] - a set of text that appears at the bottom of the prompt to help guide the user
 * @returns {Promise} Returns a promise that resolves when user completes the editor session
 * @type {exports}
 */
module.exports = function (options={}) {

    options.guidanceText = options.guidanceText || DEFAULT_GUIDANCE_TEXT;
    options.defaultText = options.defaultText || '';

    let promptUser = function () {
        return new Promise((resolve) => {
            let file = process.cwd() + '/tmp/release-af29h59gjdgs397865xsjl23323.txt';
            fs.ensureFile(file, function (err) {
                if (err) throw err;
                let text = options.guidanceText;
                if (options.defaultText) {
                    text = options.defaultText + '\n\n' + text;
                }
                fs.outputFile(file, text, function (err) {
                    if (err) throw err;
                    editor(file, function (code, sig) {
                        fs.readFile(file, 'utf8', function (err, data) {
                            if (err) throw err;
                            fs.remove(file, function (err) {
                                if (err) throw err;
                                // remove guidance text
                                resolve(data.split(options.guidanceText)[0] || '');
                            })
                        })
                    });
                });
            });
        });
    };

    return promptUser().then((message) => {
        message = message.trim();
        return message;
    });

};
