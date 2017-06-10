'use strict';

module.exports = {

    /**
     * Resolves a relative path to the external project.
     * @param paths
     */
    scopePaths: function (paths) {
        let scope = function (path) {
            return process.cwd() + '/' + path;
        };
        if (typeof paths === 'string') {
            return scope(paths);
        } else {
            return paths.map(function (path) {
                return scope(path);
            });
        }
    },

    /**
     * Returns the build-tools configuration, whether its as a bt-config file or grunt file.
     * @returns {undefined|Object}
     */
    getConfig: function () {
        let rootPath = process.cwd(),
            config;
        try {
            config = require(rootPath + '/bt-config');
        } catch (err) {
            console.warn("Project has no configuration file for bt command!");
        }

        return config;
    }

};
