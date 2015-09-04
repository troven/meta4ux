var self = module.exports

// =============================================================================
// framework packages

var fs         = require('fs');             // file system
var paths      = require('path');           // file path helper
var assert     = require('assert');         // assertions
var express    = require('express');        // call express
var _          = require('underscore');     // collections helper

// =============================================================================
// meta4 packages

var helpers     = require('meta4helpers');      // utilities

// =============================================================================
// Configure UX - load recipes from local files

exports.feature = function(meta4, feature) {

	// Sanity Checks
    assert(meta4, "feature missing {{meta4}}")
	assert(meta4.router, "feature missing {{meta4.router}}")
	assert(meta4.config, "feature missing {{meta4.config}}")
	assert(meta4.vents, "feature missing {{meta4.vents}}")

    // we need to find lots of files ... so, are we correctly configured?
	assert(feature, "feature missing {{feature}}")
    assert(feature.path, "feature missing {{feature.path}}")
    assert(feature.paths, "feature missing {{feature.paths}}")
    assert(feature.paths.models, "feature missing {{paths.models}}")
    assert(feature.paths.views, "feature missing {{paths.views}}")
    assert(feature.paths.templates, "feature missing {{paths.templates}}")
    assert(feature.paths.scripts, "feature missing {{paths.scripts}}")
	assert(feature.modelPath, "feature missing {{paths.modelPath}}")

// =============================================================================
	var router = meta4.router, config = meta4.config

	var DEBUG = feature.debug || false

	// cache UX definitions
	self.cache = helpers.mvc.reload.all(feature)

	DEBUG && console.log("UX path: ", feature.path, _.keys(self.cache))

    router.get(feature.path+"/:id?", function(req, res) {

        var port = req.get("X-Forwarded-Port") || req.connection.localPort
        var host = req.get("X-Forwarded-IP") || req.protocol+"://"+req.hostname

DEBUG && console.log("GET UX: ", req.path, " -> ", host, port   )

        // live re-generation of recipe files
	    var recipe = helpers.mvc.reload.all(feature)

	    // server-side features
	    recipe.server = {}
	    recipe.server.socketio = meta4.io?{ enabled: true }:{ enabled: false }
	    recipe.server.remote = meta4.router?{ enabled: true }:{ enabled: false }

	    // Localise recipe
	    recipe.home = "views:home"
	    recipe.id = req.params.id || config.name

        recipe.url = host+":"+port+config.basePath

	    // vent our intentions
	    meta4.vents.emit(feature.id, "home", req.user||false, recipe||false);
	    meta4.vents.emit(feature.id+":home", req.user||false, recipe||false);

	    // rewrite model URLs
	    _.each(recipe.models, function(model) {
		    model.url = model.url || config.basePath+feature.modelPath+"/"+model.id
	    })

	    res.json(recipe);

    });

    // embedded static files
    router.get('/*', function(req,res,next) {
        var path = req.params[0];
        if (path.indexOf('..') === -1) {
            var file = paths.normalize(__dirname + "/../static/"+path)
            var stat = fs.existsSync(file)
//DEBUG && console.log("UX Asset: ", file, stat?true:false)
            if (stat) {
                res.sendFile(file);
                return;
            }
        }
        next()
    });

}
