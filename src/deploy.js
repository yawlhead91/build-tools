'use strict';
var _ = require('underscore');
var Sftp = require('sftp-upload');
var fs = require('fs');

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
        path: "./"
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

    // stfp lib recognizes host--not hostname
    options.host = options.hostname;

    let sftp = new Sftp(options);

    console.log('Deploying to ' + options.host + '...');

    return new Promise((resolve, reject) => {
        sftp
            .on('error', function(err){
                console.error('Error deploying to ' + options.host + '');
                reject(err);
            })
            .on('uploading', function(pgs){
                console.log('Uploading', pgs.file);
                console.log(pgs.percent+'% completed');
            })
            .on('completed', function(){
                resolve();
                console.log('Finished deploying to ' + options.host + '...');
            })
            .upload();
    });

};
