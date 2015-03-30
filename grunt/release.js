var build = require('./../src/build');
var bump = require('./../src/bump');

module.exports = function(config, args) {
    var version = args[0];
    return bump(version).then(function () {
        return build(config);
    });
};
