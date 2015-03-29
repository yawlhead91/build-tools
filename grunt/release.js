var build = require('./../src/build');
var bump = require('./../src/bump');

module.exports = function(config, args) {
    var version = args[1];
    return bump(version).then(function () {
        return build(config);
    });
};
