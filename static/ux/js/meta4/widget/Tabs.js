define(["jquery", "underscore", "backbone", "marionette", "ux"], function ($,_, Backbone, Marionette, ux) {

    ux.view.Tabs = ux.view["meta4:ux:Tabs"] = function(options) {

		var DEBUG = options.debug || ux.DEBUG;

		options.template =  options.template || ux.compileTemplate("<div class='tabs-header' role='navigation'></div><div class='tab-content well-sm clearfix'></div>");

        var TabItem = Backbone.Marionette.ItemView.extend({
            tagName: "li", events: { "click": "doSelect" },
            template: "<a href='#{{_ id}}' title='{{comment}}' data-toggle='tab'>{{label}}</a>",
            doSelect: function() {
                this.trigger("select", this.model);
            }
        });

        var TabSelector = Backbone.Marionette.CompositeView.extend({
            isSelectable: true,
            template: "<ul class='nav nav-tabs'></ul>", childViewContainer: "ul", childView: TabItem,
            initialize: function(_options) {
                ux.initialize(this, _options)
                this.trigger("select", this.model);
            },
            childEvents: {
                "select": function(view, model, event) {
                    this.$el.find(".active").removeClass("active");
                    this.selected = model;
                    console.log("TAB: selected: %o %o %o", this, view, model);
                    // bubble navigate to ActionList parent
                    this.triggerMethod("select", model);
                    view.$el.addClass("active");
                }
            }
        });


        var config = {
			isNested: true,
	 		template: options.template,
		 	regions: { tabs: ".tabs-header" , body: ".tab-content" },
			initialize: function(_options) {
			    var self = this

				ux.initialize(this, _options)
				this._collection = this.collection;

	        	this._views = this._resolveNested(options.tabs || options.views)

				this.currentTab = _options.firstTab || _options.currentTab || _options.currentView|| _options.view
DEBUG && console.log("Init Tabs (%o) %o", this, _options)

			    this.collection = this.collection || new Backbone.Collection();
			    _.each(this._views, function(tab, id) {
			        self.currentTab = self.currentTab || id;
                    var conf = { id: _options.id+"_"+id, label: tab.title || tab.label || id, comment: tab.comment || "", goto: id }
                    self.collection.add( conf );
			    })
DEBUG && console.log("Resolved Tabs: %o %o %o", this, this._views, this.collection)

				return this;
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

			    if (self.currentTab) this.selectTab(self.currentTab)

			},

			selectTab: function(id) {
				id = ux.uid(id)
				var view = this.getNestedView(id, { model: this.model })
DEBUG && console.debug("SelectTab(%s) %o %o", id, this, view)
				if (!view) throw "scorpio4:ux:Tabs:oops:tab-not-found#"+id
				this.$el.find("[data-toggle]").closest("li").removeClass("active")
				this.$el.find("[href='#"+id+"']").closest("li").addClass("active")
				this.body.show(view)
				this.currentView = view
			}
		}

		return Backbone.Marionette.LayoutView.extend(config)
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
