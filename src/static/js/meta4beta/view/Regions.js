define(["jquery", "underscore", "backbone", "marionette", "ux"], function ($,_, Backbone, Marionette, ux) {

    ux.view.Regions= ux.view["meta4:ux:Regions"] = function(options) {

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
DEBUG && console.log("Regions: (%s) %o", this.id, options)
				return this;
			},
			onShow: function() {
				var self = this
				setTimeout(function() {
					if (!self.body || !self.body.currentView) {
console.log("Regions Activated")
						self.showAllNested(self)
					}
				}, 2)
			},
		}

		return Backbone.Marionette.LayoutView.extend(config)
	}

return ux; })
