define(["jquery", "underscore", "backbone", "marionette", "ux"], function ($,_, Backbone, Marionette, ux) {

    var idAttribute = ux.idAttribute || "id";
    var typeAttribute = ux.typeAttribute || "widget";
    var labelAttribute = ux.labelAttribute || "label";

    ux.view.Buttons = function(options, navigator) {
        var DEBUG = options.debug || ux.DEBUG;

        var ButtonItem = Backbone.Marionette.View.extend({ tagName: "button", className: "btn btn-default", template: "{{label}}",
            events: {
                "click": function() {
                    this.trigger("select", this.model, this);
                }
            },
            onRender: function() {
                var css = this.model.get("css");
                if (css) {
                    this.$el.addClass(css);
                }
                if (this.disabled || this.options.isDisabled) {
                    this.$el.addClass("disabled");
                }
            }
        });

        var ButtonBar = Backbone.Marionette.CollectionView.extend({
            childView: ButtonItem, className: "button-bar", tagName: "div",
            initialize: function(options) {
                var self = this;
                options.collection = options.collection || options.id;
                ux.initialize(this, options, navigator);
                console.log("[Buttons] init: %o -> %o ->%o", this.id, this, options.can);

                this.setFilter(function (child, index, collection) {
                    var disabled = (this.can[child.id]===false)?true:false;
                    console.log("BUTTON:FILTER: %o ( %s ) -> %o", this, disabled, arguments);
                    return disabled;
                }, { preventRender: true } );

            },
            childViewEvents: {
                "select": function(model, view) {
//                    console.log("Button Click: %o", view);
                    var go_to = model.get("goto");
                    if (go_to) {
                        this.trigger("navigate", go_to);
                    } else {
                        var action = model.id || view.id;
                        this.trigger("action", action, { model: model });
                    }
                }
            },
            childViewOptions: function(model, index) {
                var disabled = (this.can[model.id]===false)?true:false;
                console.log("Button %s %o -> disabled: %s", model.id, model, disabled);
                return _.extend({ model: model, disabled: disabled }, this.options.child);
            }
        });

        return ButtonBar;

    };

    // Widget meta-data allows runtime / editor to inspect basic capabilities
    return {
        "id": "Buttons",
        "label": "Buttons",
        "comment": "A widget that displays a toolbar-style list of Buttons",
        "triggers": [ "action", "select" ],
        "mixins": [ "isSelectable", "isActionable" ],
        "collection": true,
        "options": true,
        "fn": ux.view.Buttons
    }
});
