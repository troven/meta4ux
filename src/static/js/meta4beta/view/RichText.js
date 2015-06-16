define(["jquery", "underscore", "backbone", "marionette", "ux"], function ($,_, Backbone, Marionette, ux) {

	ux.view["meta4:ux:RichText"] = function(options) {
		options = ux.checkOptions(options);
		var DEBUG = true;

		var RichText = Backbone.Marionette.ItemView.extend({
			template: "<div data-id='{{id}}'><label>{{label}}</label><div class='ux_content'>{{html}}</div></div>",
			className: "ux_rich_text",
			initialize: function() {
				ux.model(options,this);
			},
			onRender: function() {

			}
		});
		return RichText;
	}

 	return ux; })
