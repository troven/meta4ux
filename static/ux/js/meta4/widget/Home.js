define(["jquery", "underscore", "backbone", "marionette", "core", "ux"], function ($,_, Backbone, M, core, ux) {

	var Home = function(options, module) {
		options = ux.checkOptions(options);

		var DEBUG = options.debug || ux.DEBUG;

		options.template =  options.template || ux.compileTemplate("<div class='home-regions container'><div class='home-header'></div><div class='wrapper main'><div class='col-sm-12 home-body'>loading home ...</div></div><div class='home-footer'></div></div>");

		var config = {
			isNested: true, isNavigator: true, isTemplating: true,
	 		template: options.template, isHome: true,
		 	regions: { header: ".home-regions>.home-header" , body: ".home-regions>.main>.home-body", footer: ".home-regions>.home-footer" },
		 	events: {
		 		"click [data-navigate]": ""
		 	},

			initialize: function(_options) {
                var self = this;

				_options.views.body = _options.views.body || _options.views.home;

                ux.initialize(this, _options);

                module.on("error", function(evt) {
                    console.log("HOME ERROR: %o -> %o", this, evt);
                    alert("Error:" +evt);
                });

                console.log("Home: init: %o --> %o", this, _options);
				return this;
			},

            show: function() {
			    this.render();
                this.showNestedRegions();
                this.trigger("show");
            },

			onShow: function() {
				var self = this

//				this.on("navigate", self.onNavigate);
//				if (!this.body.currentView) {
//				}
				this.attachNavigateListeners(this);
			},

			attachNavigateListeners: function(view) {
				var self = this
console.log("nested:navigate: %o", view);
				view.on("nested:navigate", self.onNavigate);
				return view;
			},

            onBreadcrumb: function(view) {
                console.log("onBreadcrumb: %o %o", this, view);
                this.header && this.header.currentView.trigger("breadcrumb", view);
                this.footer && this.footer.currentView.trigger("breadcrumb", view);
            },

			onNavigate: function(go_to) {
			    var meta = { model: this.model, collection: this.collection};
                var view = this.navigator.views.view(go_to, meta, this.navigator );
                if (!view) throw new core.oops.Error("meta4:ux:mixin:oops:missing-view#"+go_to);
//DEBUG &&
                console.log("onNavigate: %o %o %o", this, go_to, view);

                if (view._isModal)  {
                    this.navigator.Modal(view);
                } else {
                    this.body.show(view);
                    this.trigger("breadcrumb", view);
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
