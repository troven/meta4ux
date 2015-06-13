define(["jquery", "underscore", "backbone", "marionette", "ux",
	"jquery_ui"
], function ($, _, Backbone, Marionette, ux, jquery_ui) {

	var idAttribute = ux.idAttribute || "id";
	var typeAttribute = ux.typeAttribute || "widget";
	var labelAttribute = ux.labelAttribute || "label";
	var commentAttribute = ux.commentAttribute || "comment"
	var DEBUG = true; // && ux.DEBUG;

	ux.view.ActionList = ux.view["meta4:ux:ActionList"] = function(options) {
		_.defaults(options, { child: {} })

		var ListItem = Backbone.Marionette.ItemView.extend({
			tagName: "li", className: "list-group-item clickable",
			template: options.child.template || "<span data-id='{{"+ux.idAttribute+"}}' data-trigger='{{"+ux.idAttribute+"}}' title='{{"+ux.commentAttribute+"}}'>{{"+ux.labelAttribute+"}}</span>",

			isSelectable: true, isDroppable: true,
			isHoverPanel: true, isTemplating: true, isPopOver: true,
			isActionable: true, isActionMenu: true,
			events: {
                "click [data-trigger]": "doEventAction",
				"click [data-id]": "doEventSelect",
				"dblClick [data-id]": "doEventSelect",
			},
			initialize: function(_options) {
				ux.initialize(this, _options)
			},
			onRender: function() {
			    var $actions = $("[data-actions]")
			    if (!$actions||!$actions.length) return;
			},
			onSelect: function(event, model) {
				this.$el.find(".active").removeClass("active");
				var $item = this.$el.find("[about='"+model[idAttribute]+"']");
//DEBUG && console.debug("onChildViewSelect():", event, model, $item);
				$item.addClass("active");
				return this;
			}
		});

		var definition = {
			isSortable: true, isCommon: true, isActionable: true,
			isPopOver: true, isSelectable: true, isHoverPanel: true,
			childView: ListItem, tagName: "ul",
			className: "list-group",
			sortable: {
				connectWith: false
			},
			events: {
				'sortstart': 		"doEventDrag",
				"click [data-id]": 	"doEventSelect",
				"click [data-trigger]": 	"doEventAction"
			},
			childEvents: ListItem.events,
			childViewOptions: function(model, index) {
				return _.extend({ model: model, when: this.options.when }, this.options.child)
			},
			initialize: function(_options) {
				ux.initialize(this, _options)
				this.childView.template = _options.child && _options.child.template
				if (_options.empty) {
					this.emptyView = ListItem
					this.emptyView.template = _options || empty.template
					this.emptyViewOptions = function() { return _.extend({ "template": ""}, _options.empty) }
				}

				return this;
			},
		}

		return Backbone.Marionette.CollectionView.extend( definition );
	}

	return ux;
})
