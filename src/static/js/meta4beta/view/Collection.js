define(["jquery", "underscore", "backbone", "marionette", "ux"], function ($, _, Backbone, Marionette, ux) {

	var idAttribute = ux.idAttribute || "id";
	var typeAttribute = ux.typeAttribute || "widget";
	var labelAttribute = ux.labelAttribute || "label";
	var commentAttribute = ux.commentAttribute || "comment"

	ux.view.Collection = ux.view.List = ux.view["meta4:ux:Collection"] = function(options) {
		options = ux.checkOptions(options, ["id"]);
		_.defaults(options, { child: {} })
		var DEBUG = options.debug || ux.DEBUG;

		var Item = Backbone.Marionette.ItemView.extend( {
			isHoverPanel: true, isPopOver: true, isActionable: true, isTemplating: true,
			isSelectable: true,
			template: options.child.template || "<div data-id='{{id}}''>{{"+labelAttribute+"}}</div>",
			events: {
                "click [data-id]": "doAction",
				"click [data-id]": "doEventSelect",
				"dblClick [data-id]": "doEventSelect"
			},
			initialize: function(_options) {
				ux.initialize(this, _options)
			}
		});

		var config = {
			isSortable: true, isCommon: true,
			isPopOver: true, isSelectable: true, isHoverPanel: true,
			childView: Item,
			events: {
				'sortstart': 'doEventDrag',
				"click [data-id]": "doEventSelect"
			},
			childViewOptions: function() {
				return this.options.child || {}
			},
			initialize: function(_options) {
				ux.initialize(this, _options)
				this.childView.template = _options || child.template
				if (_options.empty) {
					this.emptyView = ListItem
					this.emptyView.template = _options || empty.template
					this.emptyViewOptions = function() { return _.extend({ "template": ""}, _options.empty) }
				}

				return this;
			},
		}

		return Backbone.Marionette.CollectionView.extend( config );
	}

	return ux;
})
