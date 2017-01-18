define(["jquery", "underscore", "backbone", "marionette", "ux",
	"jquery_ui"
], function ($, _, Backbone, Marionette, ux, jquery_ui) {

	var idAttribute = ux.idAttribute || "id";
	var typeAttribute = ux.typeAttribute || "widget";
	var labelAttribute = ux.labelAttribute || "label";
	var commentAttribute = ux.commentAttribute || "comment"
	var DEBUG = true; // && ux.DEBUG;

	ux.view.ActionList = ux.view["meta4:ux:ActionList"] = function(options, navigator) {
		_.defaults(options, { child: {} })


        var EmptyView  = Backbone.Marionette.ItemView.extend({
            isTemplating: true, isActionable: true,
            initialize: function(_options) {
                ux.initialize(this, _options, navigator);
            }
        });

		var ListItem = Backbone.Marionette.ItemView.extend({
			tagName: "li", className: "list-group-item clickable",
			template: options.child.template || "<a href='' title='{{"+options.child[ux.commentAttribute]+"}}'>{{"+options.child[ux.labelAttribute]+"}}</a>",

			isSelectable: true, isDroppable: false,
			isHoverPanel: false, isTemplating: true, isPopOver: false,
			isActionable: true, isActionMenu: true, isNavigator: false,
			events: {
				"click": "doEventSelect",
				"dblClick": "doEventSelect",
			},
			initialize: function(_options) {
				ux.initialize(this, _options, navigator);
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
                "select": function(view, model, event) {
                    console.log("ActionList: select: %o %o %o", this, view, model?model:"Skip: no model");
                    if (!model) return;
                    // bubble navigate to ActionList parent
                   this.triggerMethod("select", model);
                }
            },
			childViewOptions: function(model, index) {
				var _childViewOptions = _.extend({ model: model }, this.options.child);
//console.log("_childViewOptions: %o", _childViewOptions);
                return _childViewOptions;
			},
			initialize: function(_options) {
//				ux.initialize(this, _options);
				this.childView.template = _options.child && _options.child.template;
				if (_options.empty) {
					this.emptyView = EmptyView;
					this.emptyView.template = _options || empty.template;
					this.emptyViewOptions = function() {
					    return _.extend({ "template": ""}, _options.empty);
					}
				}
				console.log("ACTION LIST: init: %o", this);
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
