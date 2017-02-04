define(["jquery", "underscore", "backbone", "marionette", "ux"], function ($,_, Backbone, Marionette, ux) {

	var idAttribute = ux.idAttribute || "id";
	var typeAttribute = ux.typeAttribute || "widget";
	var labelAttribute = ux.labelAttribute || "label";

	ux.view.MenuList = ux.view["meta4:ux:MenuList"] = function(options, module) {
		options = ux.checkOptions(options, ["id", "collection"]);

        var DEBUG = true; // options.debug || ux.DEBUG;
        var isVertical = options.isVertical || options.isStacked || false;


        var MenuItem = Backbone.Marionette.ItemView.extend( _.extend({
            events: { "click": "doSelect"},
            tagName: "li", template: "<i class='icon-{{icon}} icon-2x'></i><a href='#{{id}}' title='{{comment}}'>{{label}}</a>",

            initialize: function(_options) {
                ux.initialize(this, _options);
            },

            doSelect: function() {
                this.trigger("select", this.model);
            }

        }, ux.mixin ) );

        var MenuList = Backbone.Marionette.CollectionView.extend({
            isNavigator: true, isSelectable: true,
            childView: MenuItem, tagName: "ul", className: "nav",
            childEvents: {
                "select": function(view, model, event) {
                    this.$el.find(".active").removeClass("active");

                    this.selected = this.select(model, event);
                    console.log("MenuList: selected: %o -> %o   qa", view, this.selected);
                    // bubble navigate to MenuList parent
                    this.triggerMethod("select", this.selected);
                    view.$el.addClass("active");
                }
            },
            childViewOptions: function(model, index) {
                return _.extend({ model: model }, this.options.child);
            },
            initialize: function(_options) {
                ux.initialize(this, _options);
            }
        });

		return MenuList;
	}

	// Widget meta-data allows runtime / editor to inspect basic capabilities

	return {
	    "id": "MenuList",
        "label": "Menu List",
        "comment": "A drop-down menu that hides behind a Button",
        "emits": ["action"],
        "mixins": [ "isActionable", "isNavigator" ],
        "views": false,
        "collection": false,
        "options": true,
        "schema": false,

        "fn": ux.view.MenuList
    }
})