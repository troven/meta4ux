define(["jquery", "underscore", "backbone", "marionette", "ux"], function ($,_, Backbone, Marionette, ux) {

	ux.view.Debug = ux.view["meta4:ux:Debug"] = function(options) {
		options = ux.checkOptions(options, ["id"]);
		var DEBUG = true;

		var ChildView = Backbone.Marionette.ItemView.extend({ tagName: "li",
			template: "<div data-trigger='debug' about='{{id}}'>{{label}}</div>",
		});

		var config = {
		    isTemplating: true, isActionable: true, isNavigator: true,
			template: options.template || "<div about='{{id}}'>DEBUG: {{id}}</div>",
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

 	return ux;
})
