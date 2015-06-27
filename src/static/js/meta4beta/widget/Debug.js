define(["jquery", "underscore", "backbone", "marionette", "ux"], function ($,_, Backbone, Marionette, ux) {

	ux.view.Debug = ux.view["meta4:ux:Debug"] = function(options) {
		options = ux.checkOptions(options, ["id"]);
		var DEBUG = true;

		var ChildView = Backbone.Marionette.ItemView.extend({ tagName: "li",
			template: "<div data-trigger='debug' data-id='{{id}}'>{{label}}</div>",
		});

		var config = {
		    isTemplating: true, isActionable: true, isNavigator: true,
			template: options.template || "<div data-id='{{id}}'>DEBUG: {{id}}</div>",
			childView: ChildView,
			events: {
			    "click [data-action]": "doAction",
                "click [data-trigger]": "doAction",
			    "click [data-navigate]": "doNavigate"
			},
			className: "ux_debug",
			initialize: function(options) {
				ux.initialize(this, options)
				this.on("all", function(e) {
    				console.debug("OnDebug (%s): %o %o", e, this, arguments)
				})
			},
			onDebug: function() {
			    console.debug("Click Debug: ", this, arguments, this.model.get("phases.m1.processes"))
			}
		}

		return Backbone.Marionette.CompositeView.extend(config);
	}

	// Widget meta-data allows runtime / editor to inspect basic capabilities

	return {
	    "id": "Debug",
        "label": "Debug [TODO]",
        "comment": "A widget to display events during debugging",
        "triggers": [ ],
        "can": [ "debug" ],
        "mixins": [ "isTemplating", "isActionable", "isNavigator" ],
        "views": false,
        "collection": true,
        "options": true,

        "fn": ux.view.Dashboard3D
    }
})
