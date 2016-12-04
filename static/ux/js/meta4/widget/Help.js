define(["jquery", "underscore", "backbone", "marionette", "ux"], function ($,_, Backbone, Marionette, ux) {

	ux.view.Help = ux.view["meta4:ux:Help"] = function(options) {
//		options = ux.checkOptions(options, ["id"]);
		var DEBUG = true;

		var config = {
			isTemplating: true, isActionable: true,
			isNavigator: false, isSelectable: false, isHoverPanel: false,
			isPopOver: false, isActionMenu: true,
            template: options.template || "<div><h1>Help</h1></div>",
			className: "ux_help pull-right",
			initialize: function(options) {
				_.defaults(options, { model: true })
				ux.initialize(this, options)
			}
		}

		return Backbone.Marionette.ItemView.extend(config);
	}

	// Widget meta-data allows runtime / editor to inspect basic capabilities

	return {
	    "id": "Help",
        "label": "Help [TO DO]",
        "comment": "A widget that provides hover-over help",
        "mixins": [ "isSelectable" ],
        "views": false,
        "collection": false,
        "options": true,
        "schema": false,

        "fn": ux.view.Help
    }
})
