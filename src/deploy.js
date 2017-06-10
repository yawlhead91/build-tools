'use strict';
let _ = require('underscore');
let fs = require('fs');
let Client = require('scp2').Client;
let glob = require('glob-promise');
let async = require('async-promises');
let path = require('path');
let isGlobPath = require("glob").hasMagic;
/**
 * Deploys files to a server instance using SFTP.
 * @returns {Promise} Returns a promise that resolves when completed
 * @type {exports}
 */
module.exports = function (options) {

    options = _.extend({
        hostname: "",
        username: '',
        password: '',
        protocol: 'sftp',
        port: 22,
        remoteDir: "/",
        path: "./",
        exclude: []
    }, options);

    if (!options.hostname) {
        let error = new Error('Cannot deploy: no hostname was supplied');
        console.error(error.message);
        return Promise.reject(error);
    } else if (options.protocol !== 'sftp') {
        let error = new Error('Cannot deploy: this command only supports "sftp" as the protocol atm.');
        console.error(error.message);
        return Promise.reject(error);
    }

    if (!fs.existsSync(options.path)) {
        let e = new Error(options.path + ' does not exist');
        return Promise.reject(e);
    }

    // stfp lib recognizes host--not hostname
    options.host = options.hostname;
    let client = new Client(options);

    function globberizePath (p) {
        if (!isGlobPath(p)) {

            // if project directory is desired, remove leading "./", glob will assume
            if (p[0] === '.' && p[1] === '/') {
                p = p.replace(/^(\.\/)/, "");
            }
            if (p) {
                p = path.relative(process.cwd(), p) + '/';
            }
            p = p + '**/*';
        }
        return p;
    }

    function uploadDirectory (dir) {
        return new Promise((resolve, reject) => {
            client.mkdir(dir,  (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(dir);
                }
            });
        });
    }

    function uploadFile (file) {
        return new Promise((resolve, reject) => {
            let localFile = path.relative(options.path, file),
                remoteFile = path.join(options.remoteDir, localFile);
            client.upload(file, '.'+remoteFile, function(err){
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    console.log('Deploying to ' + options.host + '...');

    return glob(globberizePath(options.path), {ignore: options.exclude, dot: true}).then((paths) => {

        if (!paths || !paths.length) {
            return Promise.resolve();
        }

        return async.eachSeries(paths, function (p) {
            let stats = fs.statSync(p);
            if(stats.isDirectory()){
                // directories are automatically created by uploadFile()
                return Promise.resolve();
            } else {
                console.log('Uploading', p);
                return uploadFile(p);
            }
        }).then(() => {
            client.close();
        });
    })
        .then(() => {
            console.log('Finished deploying to ' + options.host + '...');
        })
        .catch((err) => {
            console.error('Error deploying to ' + options.host + '');
            console.log(err.stack);
        });

};
