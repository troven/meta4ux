define(["jquery", "underscore", "backbone", "marionette", "ux"], function ($,_, Backbone, Marionette, ux) {

    var idAttribute = ux.idAttribute || "id";
    var typeAttribute = ux.typeAttribute || "widget";
    var labelAttribute = ux.labelAttribute || "label";

    ux.view.Buttons = function(options, navigator) {
        var DEBUG = options.debug || ux.DEBUG;

        var ButtonItem = Backbone.Marionette.ItemView.extend({ tagName: "button", className: "btn btn-default", template: "{{label}}",
            events: {
                "click": function() {
                    this.trigger("action");
                }
            },
            onRender: function() {
                var css = this.model.get("css");
                if (css) {
                    this.$el.addClass(css);
                }
            }
        });

        var ButtonBar = Backbone.Marionette.CompositeView.extend({
            childView: ButtonItem, className: "", tagName: "div",
            template: "<div class='button-bar'></div>",
            childViewContainer: ".button-bar",
            initialize: function(options) {
                options.collection = options.collection || options.id;
                ux.initialize(this, options, navigator);
                console.log("Buttons: %o -> %o", this, options);
            },
            childEvents: {
                "action": function(view, model) {
//                    console.log("Button Click: %o", view);
                    var action = view.model.id || view.id;
                    this.trigger("action", action, { model: view.model });
                }
            },
            childViewOptions: function(model, index) {
                var disabled = (this.can[model.id]===false)?true:false;
//                console.log("Button %s %o -> disabled: %s", model.id, model, disabled);
                return _.extend({ model: model, disabled: disabled }, this.options.child);
            },
            onRender: function() {
                if (this.disabled || this.options.isDisabled) {
                    this.$el.addClass("disabled");
                }
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
