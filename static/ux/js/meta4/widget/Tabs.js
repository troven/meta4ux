define(["jquery", "underscore", "backbone", "marionette", "ux"], function ($,_, Backbone, Marionette, ux) {

    ux.view.Tabs = ux.view["meta4:ux:Tabs"] = function(options, navigator) {

		var DEBUG = options.debug || ux.DEBUG;

		options.template =  options.template || ux.compileTemplate("<div class='tabs-header' role='navigation'></div><div class='tab-content well-sm clearfix'></div><div class='tabs-footer'>");

        var TabItem = Marionette.View.extend({
            tagName: "li", events: { "click": "doSelect" },
            template: "<a data-toggle='tab'>{{label}}</a>",
            doSelect: function() {
                this.$el.addClass("active");
                this.trigger("select", this.model);
            }
        });

        var TabSelector = Marionette.CollectionView.extend({
            template: "<div></div>", className: "nav nav-tabs",
            isSelectable: true, tagName: "ul", childView: TabItem,
            initialize: function(_options) {
                ux.initialize(this, _options)
                this.trigger("select", this.model);
            },
            childViewEvents: {
                "select": function(model, event) {
                    this.$el.find(".active").removeClass("active");
                    this.selected = model;
                    DEBUG && console.log("[Tabs] selected: %o %o %o", this, model);
                    // bubble navigate to ActionList parent
                    this.triggerMethod("select", model);
                }
            }
        });


        var defn = {
			isNested: true,
	 		template: options.template,
		 	regions: { header: ".tabs-header" , body: ".tab-content", footer: ".tabs-footer" },
			initialize: function(_options) {
                _options = _.extend({ views: {}, tabs: {} }, _options)
				ux.initialize(this, _options, navigator);
				return this;
			},
            onBeforeRender: function() {
                var self = this;
                var _options = this.options;

                this._views = this._resolveNested(_options.tabs || _options.views );
                this.currentTab = _options.firstTab || _options.currentTab || _.keys(this._views)[0];

                this.collection = this.collection || new Backbone.Collection();
                _.each(this._views, function(tab, id) {
                    self.currentTab = self.currentTab || id;
                    var title = tab.title || tab.label || id;
                    var conf = _.extend({ id: _options.id+"_"+id, label: title, comment: tab.comment || title , goto: id }, tab);
                    self.collection.add( conf );
                })
                DEBUG && console.log("[Tabs] onBeforeRender (%s) %o -> %o", this.currentTab, this, this.collection );

                var meta = { model: this.model, collection: this.collection };
                this.tabs = new TabSelector(meta);
            },
            getHeader: function() {
                var view = this.getChildView("body");
                if (!view || !view.getHeader) return false;
                return view.getHeader();
            },
            getFooter: function() {
                var view = this.getChildView("body");
                if (!view || !view.getFooter) return false;
                return view.getFooter();
            },
			onRender: function() {
			    var self = this

                this.tabs.on("select", function(model) {
                    DEBUG && console.log("[Tabs] Select: %o", model);
                    self.trigger("select", model);
                    self.selectTab( model.get("goto") || model.id );
                })
			    this.showChildView("header", this.tabs);

			    if (this.currentTab) {
			        this.selectTab(self.currentTab);
                }

                var view = this.getChildView("body");
                DEBUG && console.log("[Tabs] onRender (%s) %o %o", this.id, this, self.collection)
			},

			selectTab: function(id) {
			    var self = this;
				id = ux.uid(id)
				var view = this.getNestedView(id, { model: this.model });
DEBUG && console.debug("[Tabs] SelectTab(%s) %o %o", id, this, view)
				if (!view) throw "scorpio4:ux:Tabs:oops:tab-not-found#"+id;

                view.on("render", function() {
                    if (view.getFooter) {
                        self.showChildView("footer", view.getFooter());
                    }
                })
                this.showChildView("body", view);
			}
		}

		return Marionette.View.extend(defn)
	}

	// Widget meta-data allows runtime / editor to inspect basic capabilities

	return {
        "id": "Tabs",
        "label": "Tabs",
        "comment": "A tabbed navigation panel for nested views",

        "triggers": [ "navigate", "select" ],
        "mixins": [ "isNested" ],
        "collection": true,
        "options": true,
        "views": true,

        "fn": ux.view.Tabs
    }

})
