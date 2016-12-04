define(["jquery", "underscore", "backbone", "marionette", "ux"], function ($,_, Backbone, Marionette, ux) {

	var Template = function(options) {
		var DEBUG = true;

		var config = {
			isTemplating: true, isActionable: true, isSelectable: true,
			isNavigator: false, isHoverPanel: false, isNested: true,
			isPopOver: false, isActionMenu: true,
			template: options.template || "<div class='panel-title' data-action='{{id}}'>{{label}}</div>",
			events: {
				"click [data-id]": "doEventSelect",
				"click [data-action]": "doEventAction"
			},
			initialize: function(options) {
				_.defaults(options, { model: false })
				ux.initialize(this, options)
				this.template = (this.model&&this.model.get("template")) || options.template || this.template;
			},
            _renderTemplate: function() {
                var template = this.getTemplate();

                if (!template) {
                    throw new Error("Missing template: "+options.id);
                }

                var data = this.model.toJSON();
                // ensure we have an ID field (especially for @)
                data.id = data.id || data[this.model.idAttribute]
                data = this.mixinTemplateHelpers(data);
                console.log("Render Template: %o -> %o", this.model, data)

                // Render and add to $el
                var html = Marionette.Renderer.render(template, data, this);
                this.attachElContent(html);

                return this;
            }

        }

		return Backbone.Marionette.ItemView.extend(config);
	}

	// Widget meta-data allows runtime / editor to inspect basic capabilities

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

        "fn": Template
    }
})
