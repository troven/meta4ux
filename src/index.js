var assert = require("assert");
var debug = require("debug");
var paths = require("path");
var fs = require('fs'),

module.exports = {

    resolve: function(name) {
        var assetHome = paths.joins(__dirname,"static");
        assert(name, "Missing asset name");
        return paths.normalize( paths.join(assetHome, req.path) );
    },

    asset: function(name) {
        var file = this.resolve(name);
        return fs.createReadStream(file);
    }
}