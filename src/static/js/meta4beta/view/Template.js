define(["jquery", "underscore", "backbone", "marionette", "ux"], function ($,_, Backbone, Marionette, ux) {

	ux.view.Template = ux.view["meta4:ux:Template"] = function(options) {
		options = ux.checkOptions(options, ["template"]);
		var DEBUG = true;

		var config = {
			isTemplating: true, isActionable: true, isSelectable: true,
			isNavigator: false, isHoverPanel: false, isNested: true,
			isPopOver: false, isActionMenu: true,
				template: options.template || "<div data-id='{{id}} data-trigger='{{id}}'>{{label}}</div>",
			events: {
				"click [data-id]": "doEventSelect",
                "click [data-trigger]": "doEventAction",
				"click [data-action]": "doEventAction",
				"click [data-navigate]": "doNavigate"
			},
			initialize: function(options) {
				_.defaults(options, { model: false })
				ux.initialize(this, options)
				this.template = (this.model&&this.model.get("template")) || options.template || this.template;
			}
		}

		return Backbone.Marionette.ItemView.extend(config);
	}

   return {
        "id": "Template",
        "label": "Template",
        "comment": "A template displays custom HTML injected with data model",
        "emits": ["action"],
        "mixins": [ "isHoverPanel", "isSelectable", "isSortable", "isNavigator", "isActionable" ],
        "views": true,
        "collection": false,
        "options": true,
        "schema": false,

        "fn": ux.view.Template
    }
})
