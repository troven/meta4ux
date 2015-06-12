define(["jquery", "underscore", "backbone", "marionette", "ux"], function ($,_, Backbone, Marionette, ux) {

	ux.view.Switch = ux.view["meta4:ux:Switch"] = function(options) {
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
			},

			render: function() {
    			var switchOn = this.options.switchOn;
			    var viewType = this.model.get(switchOn)
				var options = _.extend({}, this._views[viewType])
console.log("Switch Field: %s -> %o %o", switchOn, viewType, options)
				this.currentView = this.getNestedView(options)
				this.currentView.$el = this.$el;
console.log("Switch currentView: %o", this.currentView)
 			    this.currentView.render();
			}
		}

		return Backbone.Marionette.ItemView.extend(config);
	}

 	return ux;
})
