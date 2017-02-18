define(["jquery", "underscore", "backbone", "marionette", "ux"], function ($,_, Backbone, Marionette, ux) {

    ux.view.Tabs = ux.view["meta4:ux:Tabs"] = function(options, navigator) {

		var DEBUG = options.debug || ux.DEBUG;

		options.template =  options.template || ux.compileTemplate("<div class='tabs-header' role='navigation'></div><div class='tab-content well-sm clearfix'></div>");

        var TabItem = Backbone.Marionette.View.extend({
            tagName: "li", events: { "click": "doSelect" },
            template: "<a data-toggle='tab'>{{label}}</a>",
            doSelect: function() {
                this.$el.addClass("active");
                this.trigger("select", this.model);
            }
        });

        var TabSelector = Backbone.Marionette.CompositeView.extend({
            isSelectable: true,
            template: "<ul class='nav nav-pills'></ul>", childViewContainer: "ul", childView: TabItem,
            initialize: function(_options) {
                ux.initialize(this, _options)
                this.trigger("select", this.model);
            },
            childViewEvents: {
                "select": function(model, event) {
                    this.$el.find(".active").removeClass("active");
                    this.selected = model;
                    console.log("TAB: selected: %o %o %o", this, model);
                    // bubble navigate to ActionList parent
                    this.triggerMethod("select", model);
                }
            }
        });


        var config = {
			isNested: true,
	 		template: options.template,
		 	regions: { tabs: ".tabs-header" , body: ".tab-content" },
			initialize: function(_options) {

                _options = _.extend({ views: {}, tabs: {} }, _options)

				ux.initialize(this, _options, navigator);
				this._collection = this.collection;

				return this;
			},
            onBeforeRender: function() {
                var self = this;
                var _options = this.options;

                this._views = this._resolveNested(_options.tabs || _options.views);
                this.currentTab = _options.firstTab || _options.currentTab || _.keys(_options.tabs)[0];
                DEBUG && console.log("Init Tabs (%o) %o", this, _options, this.currentTab);

                this.collection = this.collection || new Backbone.Collection();
                _.each(this._views, function(tab, id) {
                    self.currentTab = self.currentTab || id;
                    var conf = { id: _options.id+"_"+id, label: tab.title || tab.label || id, comment: tab.comment || "", goto: id }
                    self.collection.add( conf );
                })
                DEBUG && console.log("Initialzed Tabs (%s): %o", this.currentTab, this);

            },
			onShow: function() {
			    var self = this
DEBUG && console.log("Show Tabs (%s) %o %o", this.id, this, self.collection)

                var meta = { model: this.model, collection: self.collection };

                var tabs = new TabSelector(meta);
                tabs.on("select", function(model) {
 console.log("Tab Select: %o", model);
                    self.trigger("select", model);
                    self.selectTab( model.get("goto") || model.id );
                })
			    this.tabs.show(tabs);

			    if (self.currentTab) {
			        this.selectTab(self.currentTab)
                }

			},

			selectTab: function(id) {
				id = ux.uid(id)
				var view = this.getNestedView(id, { model: this.model });
DEBUG && console.debug("SelectTab(%s) %o %o", id, this, view)
				if (!view) throw "scorpio4:ux:Tabs:oops:tab-not-found#"+id;
				this.showChildView("body",view);
				this.currentView = view;
			}
		}

		return Backbone.Marionette.View.extend(config)
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
