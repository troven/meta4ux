define(["jquery", "underscore", "backbone", "marionette", "ux"], function ($,_, Backbone, Marionette, ux) {

	var Home = function(options) {
		options = ux.checkOptions(options);

		var DEBUG = options.debug || ux.DEBUG;

		options.template =  options.template || ux.compileTemplate("<div class='home-regions'><div class='home-header'></div><div class='home-body'>loading home ...</div><div class='home-footer'></div></div>");

		var config = {
			isNested: true, isNavigator: true, isTemplating: true,
	 		template: options.template,
		 	regions: { header: ".home-regions>.home-header" , body: ".home-regions>.home-body", footer: ".home-regions>.home-footer" },
		 	events: {
		 		"click [data-navigate]": "doNavigate"
		 	},
			initialize: function(_options) {
				_options.el = _options.el || "body"
				_options.views.body = _options.views.body || _options.views.home
				ux.initialize(this, _options)
				return this;
			},
			onShow: function() {
				var self = this
DEBUG && console.log("onShow: %o %o", this, this.body)
//				this.on("navigate", self.onNavigate);
//				if (!this.body.currentView) {
//					this.showAllNested()
//				}
				this.attachNavigateListeners(this)
			},
			attachNavigateListeners: function(view) {
				var self = this
				view.on("nested:navigate", self.onNavigate);
				return view;
			},
			goHome: function(go_to) {
DEBUG && console.log("goHome: %o %o", this, go_to)
			},
			onNavigateHome: function(go_to, view) {
				this.header && this.header.currentView && this.header.currentView.triggerMethod("breadcrumb:home", go_to, view)
			},
			onNavigate: function(go_to) {
				var view = this.navigateTo(go_to)
//DEBUG && 
	console.log("onNavigate: %o %o %o", this, go_to, view)
//				view && this.attachNavigateListeners(view)
//				if (this.footer && this.footer.currentView) this.footer.currentView.triggerMethod("navigate", go_to)
				if (this.header && this.header.currentView) {
					var _view = this._views[go_to]
					if (_view) {
						this.header.currentView.triggerMethod("breadcrumb:home", go_to, view)
					}
					this.header.currentView.triggerMethod("breadcrumb", go_to, view)
				}
			}
		}

		return Backbone.Marionette.LayoutView.extend(config)
	}

	// Widget meta-data allows runtime / editor to inspect basic capabilities

	return {
	    "id": "Home",
        "label": "Home",
        "comment": "A layout widget that co-ordinates navigation between nested views",
        "mixins": [ "isNested", "isNavigator", "isTemplating" ],
        "views": true,
        "collection": false,
        "options": true,
        "schema": false,

        "fn": Home
    }
})
