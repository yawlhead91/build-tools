var bt = require('build-tools');

module.exports = function(config, args) {
    var version = args[1];
    return bt.bump(version).then(function () {
        return bt.build(config);
    });
};
