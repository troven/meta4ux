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
            tagName: "li", template: "<i class='icon-{{icon}} icon-2x'></i><a href='#{{id}}' title='{{label}}'>{{label}}</a>",
            initialize: function(_options) {
                ux.initialize(this, _options);
                console.log("MenuItem: %o --> %o", this, _options);
            },
            doSelect: function() {
                this.trigger("select", this.model);
            }
        }, ux.mixin ) );

        var MenuList = Backbone.Marionette.CollectionView.extend({
            isNavigator: true,
            childView: MenuItem, tagName: "ul", className: "nav nav-pills "+(isVertical?"nav-stacked":""),
            childEvents: {
                "select": function(view, model, event) {
                    this.$el.find(".active").removeClass("active");
                    this.selected = model;
                    console.log("MenuList: selected: %o %o %o", this, view, model);
                    // bubble navigate to ActionList parent
                    this.triggerMethod("select", model);
                    view.$el.addClass("active");
                }
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