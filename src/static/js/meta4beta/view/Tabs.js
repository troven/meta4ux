define(["jquery", "underscore", "backbone", "marionette", "ux"], function ($,_, Backbone, Marionette, ux) {

    ux.view.Tabs = ux.view["meta4:ux:Tabs"] = function(options) {

		var DEBUG = options.debug || ux.DEBUG;

		options.template =  options.template || ux.compileTemplate("<div class='tabs-header'></div><div class='tab-content well-sm clearfix'></div>");

        var TabItem = Backbone.Marionette.ItemView.extend({
            tagName: "li", events: { "click": "doTabSelect" },
            template: "<a href='#{{_ id}}' title='{{comment}}' data-toggle='tab'>{{label}}</a>",
            doTabSelect: function(e) {
DEBUG && console.log("Tab Select: %o %o", this, arguments);
				 e.preventDefault();
				 e.stopImmediatePropagation();
				 this.triggerMethod("select")
             }
        })

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

			    this.collection = new Backbone.Collection()
			    _.each(this._views, function(tab, id) {
			        self.currentTab = self.currentTab || id
			        self.collection.add({ id: id, label: tab.title || tab.label || id, comment: tab.comment || "" })
			    })
DEBUG && console.log("Resolved Tabs: %o %o %o", this, this._views, this.collection)

				return this;
			},
			onShow: function() {
			    var self = this
DEBUG && console.log("Show Tabs (%s) %o %o", this.id, this, self.collection)
                var Tabs = Backbone.Marionette.CompositeView.extend({
                    template: "<div class='pull-right popover-title'>{{label}}</div><ul class='nav nav-tabs'></ul>", childViewContainer: "ul",
                    model: this.model, childView: TabItem,
                    collection: self.collection
                })
                var tabs = new Tabs()
                tabs.on("childview:select", function(e) {
                	var model = e.model
                	var newTab = model.attributes.id
DEBUG && console.log("Clicked Tab (%s) %o -> %o %s", self.id, self, model, newTab)
                    self.selectTab(newTab)
                })
			    this.tabs.show(tabs)
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
