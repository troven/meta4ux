define(["jquery", "underscore", "backbone", "marionette", "ux"], function ($,_, Backbone, Marionette, ux) {

    ux.view.Regions= ux.view["meta4:ux:Regions"] = function(options, module) {

        options = ux.checkOptions(options, ["id", "views"]);
        var DEBUG = options.debug || ux.DEBUG; // master DEBUG

        options.template =  options.template ||
            ux.compileTemplate("<div class='regions'><div class='region-header clearfix'></div><div class='region-body clearfix'></div><div class='region-footer clearfix'></div></div>");

        var view_defn = {
            isNested: true, isNavigator: true,
            template: options.template,
            className: "ux-regions",
            regions: { header: ".regions>.region-header" , body: ".regions>.region-body", footer: ".regions>.region-footer" },
            events: {
                "click [data-navigate]": ""
            },
            initialize: function(options) {
                ux.initialize(this, options, module);
                DEBUG && console.log("Regions: init: %s %o -> %o", this.id, options, this);
                return this;
            }
        }

        return Marionette.View.extend(view_defn)
    }

    // Widget meta-data allows runtime / editor to inspect basic capabilities

    return {
        "id": "Regions",
        "label": "Regions",
        "comment": "A widget that manages the layout of named views",
        "emits": [],
        "mixins": [ "isNavigator", "isNested" ],
        "views": false,
        "collection": false,
        "options": true,
        "schema": false,

        "fn": ux.view.Regions
    }

})
