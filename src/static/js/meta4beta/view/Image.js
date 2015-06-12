define(["jquery", "underscore", "backbone", "marionette", "ux"], function ($,_, Backbone, Marionette, ux) {

	// Concept Viewer - Layout
	ux.view["meta4:ux:Image"] = function(options) {
		options = ux.checkOptions(options, ["label", "url"]);

		return Backbone.Marionette.ItemView.extend({
			template: "<img src='{{url}}' title='{{label}}'/>",
			initialize: function() {
				ux.model(options, this);
			},
		});
	}

	return ux;
 })
