define(["jquery", "underscore", "backbone", "marionette", "ux"], function ($,_, Backbone, Marionette, ux) {

	var idAttribute = ux.idAttribute || "id";
	var typeAttribute = ux.typeAttribute || "widget";
	var labelAttribute = ux.labelAttribute || "label";
	var DEBUG = false && ux.DEBUG;

	ux.view.ButtonBar = ux.view["meta4:ux:ButtonBar"] = function(options) {
		options = ux.checkAttributes(options);

		var ButtonItem = Backbone.Marionette.ItemView.extend({ tagName: "li",
			template: "<a data-id='{{id}}' href='#'>{{label}}</a>",
		});

		var ButtonMenu = Backbone.Marionette.CompositeView.extend( {
			childView: ButtonItem, className: "btn-toolbar", tagName: "span",
			template: "<div class='btn-group'><button data-id='{{id}}' class='btn dropdown-toggle' data-toggle='dropdown'>{{label}}&nbsp;<span class='btn-optional caret'></span></button><ul class='btn-optional dropdown-menu'></ul></div>",
			x_template: "<div class='btn-group'><button class='btn'>{{label}}</button><button class='btn-optional btn dropdown-toggle' data-toggle='dropdown'><span class='caret'></span></button><ul class='btn-optional dropdown-menu'></ul></div>",
			childViewContainer: "ul",
			initialize: function(options) {
				ux.initialize(this, options)
			},
			onRender: function() {
				if (!this.collection || !this.collection.length) {
					this.$el.find('.btn-optional').remove();
				}
			}
		});

		var ButtonBar = Backbone.Marionette.CollectionView.extend({
			isCommon:true, isSelectable: true
			childView: ButtonMenu, className: "btn-toolbar", tagName: "div",
			events: {
			  'click [data-id]': 'doEventSelect'
			},
			initialize: function() {
				var self = this;
				ux.initialize(this, options);
DEBUG && console.debug("Init MenuButtons:", this, options);
			},
			onSelect: function(selection) {
DEBUG && console.debug("ButtonBar Selected: %o %o", self, that);
				this.model.set("label", selection.get("label"));
				this.render();
				this.triggerMethod("navigate", selection)
			}
		} );

		return ButtonBar;
	}

  return {
	    "id": "ButtonBar",
        "label": "ButtonBar",
        "comment": "A widget that displays a toolbar-style list of Buttons",

        "triggers": [ "action", "select" ],
        "mixins": [ "isSelectable", "isActionable" ],
        "collection": true,
        "options": true,

        "fn": ux.view.ButtonBar
    }

})
