define(["jquery", "underscore", "backbone", "marionette", "ux"], function ($,_, Backbone, M, ux) {

	var Home = function(options, module) {
		options = ux.checkOptions(options);

		var DEBUG = options.debug || ux.DEBUG;

		options.template =  options.template || ux.compileTemplate("<div class='home-regions'><div class='home-header'></div><div class='wrapper '><div class='main'><div class='col-sm-12 home-body'>loading home ...</div></div></div><div class='home-footer'></div></div>");

		var config = {
			isNested: true, isNavigator: true, isTemplating: true,
	 		template: options.template,
		 	regions: { header: ".home-regions>.home-header" , body: ".home-regions>.wrapper>.main>.home-body", footer: ".home-regions>.home-footer" },
		 	events: {
		 		"click [data-navigate]": "doNavigate"
		 	},

			initialize: function(_options) {
                var self = this;
				_options.el = _options.el || "body";
				_options.views.body = _options.views.body || _options.views.home;

                // TODO: this needs to refactored - so it capture events from nested menus
//                 var appRoutes = _.map(_options.views, function(v,k) {
// console.log("ROUTE: %o -> %o", v, k);
//                     self.navigateTo(k, {}, module);
//                 });
//                 console.log("@home: %o %o", this, appRoutes);
//
//                 this.router = new M.AppRouter({  });
//                 this.router.onRoute = function(name, path, args) {
//                     console.log("On Route: %s %s -> %o", name, path, args);
//                     throw "new-route";
//                 };

                module.on("navigate", function(go_to) {
                    console.log("HOME navigate: %o -> %o", this, go_to);
                    Backbone.history.navigate(go_to);
                });

                module.on("error", function(evt) {
                    console.log("HOME ERROR: %o -> %o", this, evt);
                    alert("Error:" +evt);
                });

                if (_options.ok) throw "re-enter"
                _options.ok=true
                console.log("HOME: init");

				return this;
			},

			onShow: function() {
				var self = this
DEBUG && console.log("onShow: %o %o", this, this.body);
//				this.on("navigate", self.onNavigate);
//				if (!this.body.currentView) {
//					this.showAllNested()
//				}
				this.attachNavigateListeners(this);
			},

			attachNavigateListeners: function(view) {
				var self = this
				view.on("nested:navigate", self.onNavigate);
				return view;
			},

			onNavigateHome: function(go_to, view) {
				this.header && this.header.currentView && this.header.currentView.triggerMethod("breadcrumb:home", go_to, view)
			},

			onNavigate: function(go_to) {
                console.log("onNavigate: %o", this);
				var view = this.navigateTo(go_to);
//DEBUG &&
                console.log("onNavigate: %o %o %o", this, go_to, view)
// throw "go_to: "+go_to;
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

		return M.LayoutView.extend(config);
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
