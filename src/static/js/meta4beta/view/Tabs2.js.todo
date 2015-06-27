define(["jquery", "underscore", "backbone", "marionette", "ux"], function ($,_, Backbone, Marionette, ux) {

    ux.view.Tabs = ux.view["meta4:ux:Tabs"] = function(options) {
		options = ux.checkOptions(options, ["id"]);
		var DEBUG = true // && ux.DEBUG;

		options.template =  options.template || ux.compileTemplate("<div class='tabs-header'></div><div class='tab-content'></div>");

        var TabItem = Backbone.Marionette.ItemView.extend({
            tagName: "li", events: { "click": "doTabSelect" },
            template: "<a href='#{{_ id}}' title='{{comment}}' data-toggle='tab'>{{label}}</a>",
            doTabSelect: function(e) { console.log("Tab Select: %o %o", this, arguments); e.preventDefault(); e.stopImmediatePropagation(); this.triggerMethod("select") }
        })

		var config = {
			isNested: true,
	 		template: options.template,
		 	regions: { tabs: ".tabs-header" , body: ".tab-content" },
			initialize: function(_options) {
				ux.initialize(this, _options)
			    this.collection = this.collection || new Backbone.Collection()
				this.currentTab = _options.firstTab
				this.initTabs()
				return this;
			},
			initTabs: function() {
			    var self = this
				self._views = {}
				var tabs = self.options.tabs || self.options.views
DEBUG && console.log("Init Tabs (%s) %o", this.id, tabs)
			    _.each(tabs, function(tab, id) {
			        self.currentTab = self.currentTab || id
			        self.collection.add({ id: id, label: tab.title || id, comment: tab.comment || "" })
			    })

				var remodelTab = function() {
console.log("Remodel Tabs %o %o %o", self, self.collection, self.options.tab)
					self.collection.each(function(model) {
						var id = ux.ux.uid(model.id)
						self.currentTab = self.currentTab || id
						self._views[id] = _.extend({}, model.toJSON(), self.options.tab)
					})
				}

				if (_.isObject(self.options.tab)) {
					remodelTab()
				}
				this.on("render", remodelTab)
			},
			onShow: function() {
			    var self = this

//DEBUG &&
console.log("Show Tabs (%s) %o %o", this.id, this, self.collection)
                var Tabs = Backbone.Marionette.CompositeView.extend({
                    template: "<div class='pull-right popover-title'>{{label}}</div><ul class='nav nav-tabs'></ul>", childViewContainer: "ul",
                    model: this.model, childView: TabItem,
                    collection: this.collection
                })
                var tabs = new Tabs()
                tabs.on("childview:select", function(e) {
					var newTab = e.model.attributes.id
console.log("Clicked Tabs (%s) %o -> %o", self.id, self, newTab)
                    self.selectTab(newTab)
                })
			    this.tabs.show(tabs)
			    if (self.currentTab) this.selectTab(self.currentTab)

			},

			selectTab: function(id) {
				this.$el.find("[data-toggle]").closest("li").removeClass("active")
				this.$el.find("[href='#"+id+"']").closest("li").addClass("active")

				id = ux.ux.uid(id)
console.debug("ViewTab(%s): %o ", id, this._views)
				var view = this.getNestedView(id)
				if (!view) throw "scorpio4:ux:Tabs:oops:tab-not-found#"+id
				this.body.show(view)
				var options = view.options
console.debug("SelectTab(%s): %o %o %o", id, this, view, options)
				var header = options.header && ux.views.widget(options.header)
				var footer = options.footer && ux.views.widget(options.footer)
console.debug("Tab Header/Footer(%s) %o %o", id, header, footer)
			}
		}

		return Backbone.Marionette.LayoutView.extend(config)
	}

return ux; })
