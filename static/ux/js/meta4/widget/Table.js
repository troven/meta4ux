define(["jquery", "underscore", "backbone", "marionette", "ux"], function ($, _, Backbone, Marionette, ux) {

	var idAttribute = ux.idAttribute || "id";
	var typeAttribute = ux.typeAttribute || "widget";
	var labelAttribute = ux.labelAttribute || "label";
	var commentAttribute = ux.commentAttribute || "comment"

	ux.view.Collection = ux.view["meta4:ux:Collection"] = function(options) {
		_.defaults(options, { child: {} })
		var DEBUG = options.debug || ux.DEBUG;

		var Item = Backbone.Marionette.ItemView.extend( {
			isHoverPanel: true, isPopOver: true, isActionable: true, isTemplating: true,
			isSelectable: true,
			template: options.child.template || "<div data-id='{{id}}''>{{"+labelAttribute+"}}</div>",
			events: {
                "click [data-id]": 	    "doEventSelect",
                "click [data-trigger]": "doEventAction",
				"dblClick [data-id]": "doEventSelect",
                "dblClick [data-trigger]": "doEventAction",
			},
			initialize: function(_options) {
				ux.initialize(this, _options)
			}
		});

		var config = {
			isSortable: false, isCommon: true, isActionable: true,
			isPopOver: true, isSelectable: true, isHoverPanel: true, isNested: true,
			isNestedView: true,
			childView: Item, childViewContainer: ".list-group",
            "template": '<div class="bootcards-list"> <div class="panel panel-default"> <div class="panel-body"><div class="list-group"></div></div><div class="panel-footer">{{comment}}</div></div></div>',
			events: {
                "click [data-id]": 	    "doEventSelect",
                "click [data-trigger]": "doEventAction"
			},
			childViewOptions: function() {
				return _.extend({
                    "template": '<div class="list-group-item" data-id="{{id}}"><h4 class="list-group-item-heading">{{label}}</h4><p class="list-group-item-text">{{comment}}</p></div>'
                },this.options.child);
			},

			initialize: function(_options) {
				ux.initialize(this, _options)
				this.childView.template = _options || child.template
				if (_options.empty) {
					this.emptyView = Item
					this.emptyViewOptions = function() { return _.extend({ "template": _options.empty.template || "No records" }, _options.empty) }
				}

//                ux.checkOptions(options, ["template", "collection"]);

				return this;
			},
            onShow: function() {
                this.onActionSearch();
            },
            onActionCreate: function() {
                var model = new this.collection.model();

                var view = this.getNestedView("create", { model: model })
console.log("Action View: %o %o %o", this, model, view)
                var $el = this.$el.find(".panel-footer");
                $el.empty().append(view.render().$el)
            },
            onActionSearch: function() {
                var $el = this.$el.find(".panel-footer");
                var $view = $('<div class="row"><div class="col-xs-8"><div class="form-group"><input type="text" class="form-control" placeholder="Search ..."><i class="fa fa-search"></i></div></div><div class="col-xs-3"><div data-trigger="create" class="btn btn-primary btn-block" href="#"><i class="fa fa-plus"></i>create</div></div>');
console.log("Action Search: %o %o", this, $el, $view)
                $el.append($view)
            }
		}

		return Backbone.Marionette.CompositeView.extend( config );
	}

	// Widget meta-data allows runtime / editor to inspect basic capabilities

	return {
	    "id": "Collection",
        "label": "Collection",
        "comment": "A widget that manages a collection of related items",

        "triggers": [ "action", "select" ],
        "mixins": [ "isSelectable", "isActionable" ],
        "collection": true,
        "options": true,
        "child": true,

        "fn": ux.view.Collection
    }
})
