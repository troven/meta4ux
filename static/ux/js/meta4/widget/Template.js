define(["jquery", "underscore", "backbone", "marionette", "ux"], function ($,_, Backbone, Marionette, ux) {

	var Template = function(options) {
		var DEBUG = options.debug || ux.DEBUG;

		var config = {
			isTemplating: true, isActionable: true, isSelectable: true,
			isNavigator: true, isHoverPanel: false, isNested: true,
			isPopOver: false, isActionMenu: false,
			template: options.template || "<div class='panel-title' data-action='{{id}}'>{{label}}</div>",
			events: {
                "click [data-navigate]": "doEventNavigate",
				"click [data-action]": "doEventAction"
			},
			initialize: function(options) {
				_.defaults(options, { model: true });
				ux.initialize(this, options)
				this.template = (this.model&&this.model.get("template")) || options.template || this.template;
			},
            onRender: function() {
//			    console.log("onRenderTemplate: %o", this);
			    this.attachedNestedViews();
            },
            onShow: function() {
//               console.log("onShowTemplate: %o", this);
                this.attachExplicitActions();
            },
            _renderTemplate: function() {
                var template = this.getTemplate();

                if (!template) {
                    throw new Error("Missing template: "+options.id);
                }

                var data = this.model.toJSON();
                // ensure we have an ID field (especially for @)
                data.id = data.id || data[this.model.idAttribute];
                data = this.mixinTemplateHelpers(data);
                DEBUG && console.log("Render Template: %o -> %o", this.model, data);

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
