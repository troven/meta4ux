var debug = require("debug")("meta4ux");
var paths = require("path");
var fs = require('fs');

module.exports = {

    resolve: function(name) {
        var assetHome = paths.normalize(paths.join(__dirname,"../static"));
        if (!name) return assetHome;
        return paths.normalize( paths.join(assetHome, name) );
    },

    asset: function(name) {
        var file = this.resolve(name);
        debug("asset stream: %s", file);
        return fs.createReadStream(file);
    }
}