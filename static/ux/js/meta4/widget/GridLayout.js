define(["jquery", "underscore", "backbone", "marionette", "ux"], function ($,_, Backbone, Marionette, ux) {

    ux.view.GridLayout= ux.view["meta4:ux:GridLayout"] = function(options) {

		options = ux.checkOptions(options, ["id", "views"]);
		var DEBUG = options.debug || ux.DEBUG; // master DEBUG

		options.template =  options.template || ux.compileTemplate("<div class='regions'><div class='region-header'></div><div class='region-body'></div><div class='region-footer'></div></div>");

		var config = {
			isNested: true, isNavigator: true,
	 		template: options.template,
            regions: { header: ".regions> .region-header" , body: ".regions> .region-body", footer: ".regions> .region-footer" },
		 	events: {
		 		"click [data-navigate]": "doNavigate"
		 	},
			initialize: function(options) {
				ux.initialize(this, options)
DEBUG && console.log("GridLayout: (%s) %o", this.id, options)
				return this;
			},
			onRender: function() {
				_.each(this.views, function(view) {

				})
			}
		}

		return Backbone.Marionette.CompositeView.extend(config)
	}

	// Widget meta-data allows runtime / editor to inspect basic capabilities

	return {
	    "id": "GridLayout",
        "label": "GridLayout",
        "comment": "A widget that manages the layout of nested views",
        "emits": [],
        "mixins": [ "isNavigator", "isNested" ],
        "views": false,
        "collection": false,
        "options": true,
        "schema": false,

        "fn": ux.view.GridLayout
    }

})
