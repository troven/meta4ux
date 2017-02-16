define(["jquery", "underscore", "backbone", "marionette", "ux",
	"jquery_ui"
], function ($, _, Backbone, Marionette, ux, jquery_ui) {

	var idAttribute = ux.idAttribute || "id";
	var typeAttribute = ux.typeAttribute || "widget";
	var labelAttribute = ux.labelAttribute || "label";
	var commentAttribute = ux.commentAttribute || "comment"

	ux.view.ActionList = ux.view["meta4:ux:ActionList"] = function(options, navigator) {
		_.defaults(options, { child: {}, views: {} })
        var DEBUG = options.debug?true:false;

        var EmptyView  = Backbone.Marionette.ItemView.extend({
            isTemplating: true, isActionable: false, isSelectable: true,
            initialize: function(_options) {
                ux.initialize(this, _options, navigator);
            }
        });

		var ListItem = Backbone.Marionette.ItemView.extend({
			tagName: "li", className: "list-group-item clickable",
			template: options.child.template || "<a href='#{{id}}' title='{{comment}}'>{{label}}</a>",

			isSelectable: false, isDroppable: false,
			isHoverPanel: false, isTemplating: true, isPopOver: false,
			isActionable: true, isActionMenu: false, isNavigator: false,
			events: {
                "click": "doActionEvent",
				"dblClick": "doEventSelect",
			},
			initialize: function(_options) {
				ux.initialize(this, _options, navigator);
			},
            doActionEvent: function(event, model) {
                var $about = $(event.currentTarget).closest("[data-action]");
                var data = $about.data() || this.model.attributes;
                var action = data.action || "select";
                var meta = { model: this.model, collection: this.collection };

                DEBUG && console.log("doActionEvent (%s) %o %o %o ", action, event, $about, data);
                this.trigger("action", action , meta);
            },
            onRender: function() {
                this.attachExplicitActions();
            }
		});

		var definition = {
			isSortable: false, isCommon: true, isActionable: true, isNested: true,
            isPopOver: false, isSelectable: true, isHoverPanel: false,
			childView: ListItem, tagName: "ul",
			className: "list-group",
			sortable: {
				connectWith: false
			},
			events: {
				"sortstart": "doEventDrag",
			},
            childEvents: {
			    "click [data-action]": function() {
                    console.log("[ActionList] click: %o %o", this, arguments);
                },
                "action": function(view, action, meta) {

                    if (action) {
                        DEBUG && console.log("[ActionList] action: %s: %o -> %o", action, this, arguments);
                        this.triggerMethod("action", action, meta);
                        this.triggerMethod(""+action, meta);
                    } else if (this.isSelectable===true) {
                        //DEBUG &&
                        console.log("[ActionList] select: %o: %o -> %o", this, view, meta);
                        this.triggerMethod("select", meta.model);
                    // } else {
                    //     DEBUG && console.log("[ActionList] no select: %o: %o -> %o", this, view, meta);
                    }
                },
                "select": function(view, model, event) {
                    if (!model) return;
                    var isSelectable = (this.isSelectable && !(this.options.isSelectable===false));
                    console.log("ActionList: %s: %o %o %o", (isSelectable?"select":"action"), this, view, model?model:"Skip: no model");
                    if ( isSelectable )  {
                        // bubble navigate to ActionList parent
                        this.triggerMethod("select", model);
                    } else {
//                        this.doEventAction( { currentTarget: $("[data-action]", view.$el) }, {model: model } );
                    }
                }
            },
			childViewOptions: function(model, index) {
				return _.extend({ model: model }, this.options.child);
			},
			initialize: function(_options) {
				ux.initialize(this, _options);
				this.childView.template = _options.child && _options.child.template;
				if (_options.empty) {
					this.emptyView = EmptyView;
					this.emptyView.template = _options || empty.template;
					this.emptyViewOptions = function() {
					    return _.extend({ "template": ""}, _options.empty);
					}
				}
				console.log("ACTION LIST: init: %s -> %o", this.id, this);
				return this;
			}
		}

		return Backbone.Marionette.CollectionView.extend( definition );
	}

	// Widget meta-data allows runtime / editor to inspect basic capabilities

   return {
	    "id": "ActionList",
        "label": "ActionList",
        "comment": "A widget that displays a collection of items and triggers an Action event when an item is selected.",

        "triggers": [ "sortstart", "action", "select" ],
        "mixins": [ "isNested", "isSortable", "isSelectable", "isHoverPanel", "isActionable", "isDroppable" ],
        "collection": true,
        "options": true,
        "views": true,

        "fn": ux.view.ActionList
    }
})
