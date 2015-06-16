var self = exports = module.exports = module.exports || {};

// =============================================================================
// framework packages

var fs         = require('fs');             // file system
var paths      = require('path');           // file path helper
var assert     = require('assert');         // assertions
var express    = require('express');        // call express
var _          = require('underscore');     // collections helper

// =============================================================================
// meta4 packages

var helper     = require('meta4helpers');      // utilities

// =============================================================================
// Configure UX - load recipes from local files

exports.feature = function(meta4, feature) {

    assert(meta4, "feature needs meta4")
	var router = meta4.router, config = meta4.config

    assert(router, "feature arguments: router")
    assert(feature, "feature arguments: feature")
    assert(config, "feature arguments: config")

    // we need to find lots of files ... so, are we correctly configured?
    assert(feature.path, "{{ux}} feature not configured")
    assert(feature.paths, "{{paths}} feature not configured")
    assert(feature.paths.models, "{{paths.models}} feature not configured")
    assert(feature.paths.views, "{{paths.views}} feature not configured")
    assert(feature.paths.templates, "{{paths.templates}} feature not configured")
    assert(feature.paths.scripts, "{{paths.scripts}} feature not configured")

    // why??
    assert(config.features.crud, "UX requires CRUD configuration");
    assert(config.features.crud.home, "CRUD {{home}} is missing");


    var DEBUG = feature.DEBUG || false

DEBUG && console.log("UX path: ", feature.path)
    router.get(feature.path, function(req, res) {

DEBUG && console.log("GET UX: ", req.path)

        // live re-generation of recipe files
        // NOTE: blocking I/O inside
        var recipe = self.handle(feature, config)
        recipe.url = req.protocol+"://"+req.hostname+":"+config.port+config.basePath
        res.json(recipe);

    });

    // embedded static files
    router.get('/*', function(req,res,next) {
        var path = req.params[0];
        if (path.indexOf('..') === -1) {
            var file = paths.normalize(__dirname + "/../static/"+path)
            var stat = fs.existsSync(file)
DEBUG && console.log("UX Asset: ", file, stat?true:false)
            if (stat) {
                res.sendFile(file);
                return ;
            }
        }
        next()
    });

}

// =============================================================================
// dynamically build the UX definition

exports.handle = function(feature, config) {

    var recipe = { views: {}, models: {}, scripts: {}, templates: {} }

    var AcceptJSON = function(file, data) { return file.indexOf(".json")>0 }
    var AcceptHTML = function(file, data) { return file.indexOf(".html")>0 }
    var AcceptECMA = function(file, data) { return file.indexOf(".js")>0 }

    // =============================================================================
    // load the View definitions

    var viewsDir = feature.paths.views
    helper.files.mkdirs(viewsDir)
    var found  = helper.files.find(viewsDir, AcceptJSON )

    // create View recipe
    _.each( found, function(data, file) {
        try {
            var view = JSON.parse(data)
            view.id = view.id || path.basename(path.normalize(file), ".json")
            recipe.views[view.id] = view
        } catch(e) {
            console.error("Error:", file, e)
        }
    })

    // =============================================================================
    // load the Model definitions

    var modelsDir = feature.paths.models
    helper.files.mkdirs(modelsDir)
    found  = helper.files.find(modelsDir, AcceptJSON )

    _.each( found, function(data, file) {
        if (!data) return
        try {
            var model = JSON.parse(data)
        } catch(e) {
            console.log("Corrupt JSON:", file)
        }

        // only designated client models
        if (model.isClient) {
            model.id = model.id || path.basename(file, ".json")
            recipe.models[model.id] = model
        }

        model.url = model.url || config.basePath+feature.crud+"/"+model.id
//        console.log("\tmodel: ", model.id, "@", model.url)
    })

    // =============================================================================
    // load the HTML Templates

    var templatesDir = feature.paths.templates
    helper.files.mkdirs(templatesDir)
    found  = helper.files.find(templatesDir, AcceptHTML )

    // add templates to recipe
    var assetKey = "templates"
    _.each( found, function(data, file) {
        var id = file.substring(feature.paths[assetKey].length+1)
//console.log("UX: template", id)

        // strip repetitive whitespace
        recipe.templates[assetKey+":"+id] = (""+data).replace(/\s+/g, ' ');
    })

    // =============================================================================
    // load the client-side JS scripts

    var scriptsDir = feature.paths.scripts
    helper.files.mkdirs(scriptsDir)
    found  = helper.files.find(scriptsDir, AcceptECMA )

    // add JS scripts to recipe
    assetKey = "scripts"
    _.each( found, function(data, file) {
        var id = file.substring(feature.paths[assetKey].length+1)
//console.log("UX: script", id)
        recipe.scripts[assetKey+":"+id] = ""+data
    })

    // UX recipe
    recipe.home = "views:home"
    recipe.id = config.name

    return recipe
}
