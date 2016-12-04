define(["jquery", "underscore", "backbone", "marionette", "ux"], function ($,_, Backbone, Marionette, ux) {

	var idAttribute = ux.idAttribute || "id";
	var typeAttribute = ux.typeAttribute || "widget";
	var labelAttribute = ux.labelAttribute || "label";
	var DEBUG = false || ux.DEBUG;

	ux.view.MenuList = ux.view["meta4:ux:MenuList"] = function(options) {
		options = ux.checkOptions(options, ["id", "collection"]);
		_.defaults(options, { child: {} })

		var MenuItem = Backbone.Marionette.ItemView.extend({ tagName: "li",
            isTemplating: true,
			initialize: function(_options) {
				ux.initialize(this,_options)
            },
			template: "<a data-id='{{id}}' data-navigate='{{id}}' title='{{comment}}' href='#'><i class='fa fa-{{icon}}'></i><span>{{label}}</span></a>",
		});

		var MenuList = Backbone.Marionette.CollectionView.extend( {
			isSelectable: false, isNavigator: true, isPopOver: false,
			childView: MenuItem,
			className: "nav nav-pills menu-list", tagName: "ul",
			childViewContainer: "ul",
			events: {
			  'click [data-navigate]': 'doNavigate'
			},
			initialize: function(_options) {
				ux.initialize(this,_.defaults(_options, { model: true} ))

				if (_options.child) {
DEBUG && console.log("MenuList Child Options: %o %o", this, _options.child)
				    this.options.childViewOptions = _options.child
				}

				if (_options.empty) {
					this.emptyView = MenuItem
					this.emptyView.template = _options || empty.template
					this.emptyViewOptions = function() { return _.extend({ "template": ""}, _options.empty) }
				}
			},
			onSelect: function(selection) {
				if (!selection) throw "meta4:ux:oops:missing-selection";
DEBUG && console.log("MenuList Select: %o %o", this, selection)
				this.trigger("navigate", selection)
				return this;
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