let log = require('../log');

/**
 * Bumps the version of the npm package, commits it as an
 * entry and pushes it both locally and remotely to the master branch repo.
 * @param args - The cli arguments
 * @deprecated since 7.1.0
 * @returns {*}
 */
module.exports = function (args) {
    log.warn('version', 'The version command has been deprecated, please see the "release" command which may better suit your needs.')
};
