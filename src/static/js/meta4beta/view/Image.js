define(["jquery", "underscore", "backbone", "marionette", "ux"], function ($,_, Backbone, Marionette, ux) {

	// Concept Viewer - Layout
	ux.view.Image = ux.view["meta4:ux:Image"] = function(options) {
		options = ux.checkOptions(options, ["label", "url"]);

		return Backbone.Marionette.ItemView.extend({
			template: "<img src='{{url}}' title='{{label}}'/>",
			initialize: function() {
				ux.model(options, this);
			},
		});
	}

	// Widget meta-data allows runtime / editor to inspect basic capabilities

	return {
	    "id": "Image",
        "label": "Image",
        "comment": "An simple Image viewer",
        "mixins": [],
        "views": false,
        "collection": false,
        "options": true,
        "schema": false,

        "fn": ux.view.Image
    }
 })
