define(["jquery", "underscore", "backbone", "marionette", "ux"], function ($,_, Backbone, Marionette, ux) {

	ux.view.StateView = ux.view["meta4:ux:StateView"] = function(options) {
//		options = ux.checkOptions(options, ["id"]);
		var DEBUG = true;

		var config = {
			isTemplating: false, isActionable: false,
			isNavigator: false, isSelectable: false, isHoverPanel: false,
			isNested: true, isPopOver: false, isActionMenu: false,
			events: {
			},
			initialize: function(options) {
				_.defaults(options, { model: false, switchOn: "viewType" })
				ux.initialize(this, options)

				var self = this;
    			var stateAttr = this.options.stateAttribute || "view";
    			this.model.on("change:"+stateAttr, function() {
    			    self.render()
    			})
			},

			render: function() {
    			var switchOn = this.options.stateAttribute || "view";
			    var viewType = this.model.get(stateAttr)
				var options = _.extend({}, this._views[viewType])
console.log("Switch Field: %s -> %o %o", switchOn, viewType, options)
				var meta = { model: this.model, collection: this.collection }
				this.currentView = this.getNestedView(viewType, meta)
				this.currentView.$el = this.$el;
console.log("Switch currentView: %o", this.currentView)
 			    this.currentView.render();
			}
		}

		return Backbone.Marionette.ItemView.extend(config);
	}

	// Widget meta-data allows runtime / editor to inspect basic capabilities

	return {
        "id": "StateView",
        "label": "State View",
        "comment": "A view that depends upon a model attribute",
        "emits": [],
        "mixins": [ "isNested" ],
        "views": true,
        "collection": false,
        "options": true,
        "schema": false,

        "fn": ux.view.StateView
    }
})
