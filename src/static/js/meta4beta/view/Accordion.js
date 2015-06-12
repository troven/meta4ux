define(["jquery", "jquery_ui", "underscore", "backbone", "marionette", "core", "ux"], function ($, jquery_ui, _, Backbone, Marionette, scorpio4, ux) {

	var idAttribute = ux.idAttribute || "id";
	var typeAttribute = ux.typeAttribute || "widget";
	var labelAttribute = ux.labelAttribute || "label";
	var commentAttribute = ux.commentAttribute || "comment"
	var DEBUG = true; // && ux.DEBUG;

	ux.view.Accordion = ux.view["meta4:ux:Accordion"] = function(options) {
		options = ux.checkOptions(options, ["id"]);
		_.defaults(options, { child: {} })

		options.childViewOptions = options.child

		var PanelItem = Backbone.Marionette.ItemView.extend( {
			tagName: "li", isHoverPanel: true, isActionable: true, isTemplating: true,
			className: "list-group-item",
			template: options.child.template || "<div about='{{"+idAttribute+"}}' title='{{"+commentAttribute+"}}'>{{"+labelAttribute+"}}</div><div>{{"+commentAttribute+"}}</div>",
			events: {
                "click [data-action]": "doAction",
                "click [data-trigger]": "doAction",
				"click [about]": "doEventSelect",
				"dblClick [about]": "doEventSelect"
			},
			initialize: function(_options) {
				ux.initialize(this, _options)
			},
			onSelect: function(event, model) {
				this.$el.find(".active").removeClass("active");
				var $item = this.$el.find("[about='"+model[idAttribute]+"']");
//DEBUG && console.debug("onChildViewSelect():", event, model, $item);
				$item.addClass("active");
				return this;
			}
		});

		var Accordion = {
			isSortable: true, isCommon: true,
			isPopOver: true, isSelectable: true, isHoverPanel: true,
			childView: PanelItem, tagName: "ul",
			events: {
				'sortstart': 'doEventDrag',
				"click [about]": "doEventSelect"
			},
			initialize: function(_options) {
				ux.initialize(this, _options)
				this.childView.template = _options || child.template
				if (_options.empty) {
					this.emptyView = PanelItem
					this.emptyView.template = _options || empty.template
					this.emptyViewOptions = function() { return _.extend({ "template": ""}, _options.empty) }
				}

				return this;
			},
			onRender: function() {
console.log("onRenderAccordion: %o", this.$el)
			    this.$el.accordion();
			}
		}

		return Backbone.Marionette.CollectionView.extend( Accordion );
	}

	return ux;
})
