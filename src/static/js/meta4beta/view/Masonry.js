define(["jquery", "underscore", "backbone", "marionette", "ux", "masonry"], function ($, _, Backbone, Marionette, ux, Masonry) {

	var idAttribute = ux.idAttribute || "id";
	var typeAttribute = ux.typeAttribute || "widget";
	var labelAttribute = ux.labelAttribute || "label";
	var commentAttribute = ux.commentAttribute || "comment"

	ux.view.Masonry = ux.view["meta4:ux:Masonry"] = function(options) {
		options = ux.checkOptions(options, ["id"]);
		_.defaults(options, { child: {} })
		var DEBUG = options.debug || ux.DEBUG;

		var Item = Backbone.Marionette.ItemView.extend( {
			isHoverPanel: true, isPopOver: true, isActionable: true, isTemplating: true,
			isSelectable: true, className: "gallery-item",
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
			isSortable: false, isCommon: true, isPopOver: true, isSelectable: true, isHoverPanel: true,
			childView: Item,
			className: "row",
			events: {
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
			onRender: function() {
				var options = _.extend({itemSelector: ".gallery-item", columnWidth: 200 }, this.options.options)
				var masonry = new Masonry(this.$el[0], options);
				console.log("Masonry: %o %o", options, masonry)
			}
		}

		return Backbone.Marionette.CollectionView.extend( config );
	}

	// Widget meta-data allows runtime / editor to inspect basic capabilities

	return {
	    "id": "Masonry",
        "label": "Image Gallery",
        "comment": "An interactive Image gallery with animated layouts",
        "mixins": [],
        "views": false,
        "collection": false,
        "options": true,
        "schema": false,

        "fn": ux.view.Masonry
    }
})
