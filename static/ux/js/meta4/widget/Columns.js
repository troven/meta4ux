define(["jquery", "underscore", "backbone", "marionette", "ux"], function ($,_, Backbone, Marionette, ux) {

    ux.view.Columns= ux.view["meta4:ux:Columns"] = function(options) {

		options = ux.checkOptions( options, ["id", "views"] );
		var DEBUG = options.debug || ux.DEBUG; // master DEBUG

		options.template =  options.template || ux.compileTemplate("<div class='Columns'><div class='region-header'></div><div class='region-body'></div><div class='region-footer'></div></div>");

		var config = {
			isNested: true, isNavigator: true,
	 		template: options.template,
	 		className: "ux-Columns",
            Columns: { header: ".Columns>.region-header" , body: ".Columns>.region-body", footer: ".Columns>.region-footer" },
		 	events: {
		 		"click [data-navigate]": "doNavigate"
		 	},
			initialize: function(options) {
				ux.initialize(this, options)
DEBUG && console.log("Columns: (%s) %o", this.id, options)
				return this;
			},
			x_onShow: function() {

				var self = this
				setTimeout(function() {
DEBUG && console.log("Columns Activated", self)
					if (!self.body || !self.body.currentView) {
						self.showAllNested( {model: self.model, collection: self.collection} )
					}
				}, 2)
			},
		}

		return Backbone.Marionette.LayoutView.extend(config)
	}

	// Widget meta-data allows runtime / editor to inspect basic capabilities

	return {
	    "id": "Columns",
        "label": "Columns",
        "comment": "A widget that displays sequential views",
        "emits": [],
        "mixins": [ "isNavigator", "isNested" ],
        "views": false,
        "collection": false,
        "options": true,
        "schema": false,

        "fn": ux.view.Columns
    }

})
