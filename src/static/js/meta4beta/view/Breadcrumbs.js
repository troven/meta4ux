define(["jquery", "underscore", "backbone", "marionette", "ux"], function ($,_, Backbone, Marionette, ux) {

	ux.view.Breadcrumbs = ux.view["meta4:ux:Breadcrumbs"] = function(options) {
//		options = ux.checkOptions(options, ["id"]);
		var DEBUG = true;

		options.template =  options.template || ux.compileTemplate("<ul class='breadcrumb'></ul>");
		var config = {
			isTemplating: true, isActionable: true, isNested: false,
			isSelectable: true, isHoverPanel: false,
			isPopOver: false, isActionMenu: false,
	 		template: options.template,
			childView: Marionette.ItemView,
			childViewContainer: "ul",
			childViewOptions: {
				tagName: "li",
				template: "<a href='#' data-navigate='{{id}}' >{{label}}</a>"
			},
			initialize: function(options) {
				_.defaults(options, { model: true })
				ux.initialize(this, options)
				this.collection = new Backbone.Collection()
				this.onBreadcrumbHome();
			},
			onBreadcrumbHome: function() {
DEBUG && console.log("Breadcrumb Home: %o", this)
				this.collection.reset()
				this.collection.add( { id: 'home', label: options.label } )
			},
//			doBreadcrumb: function(e) {
//DEBUG && console.log("doBreadcrumb: %o %o", this, e)
//			},
			onBreadcrumb: function(go_to, view) {
				if (go_to && view && view.model) {
					if (go_to.indexOf("/")<0) this.onBreadcrumbHome();
					var attrs = view.model.attributes.label?view.model.attributes:view.options
					attrs.label && this.collection.add(attrs)
DEBUG && console.log("Breadcrumb: %o (%s) -> %o %o", this, view.id, view, attrs)
				}
			}
		}

		return Backbone.Marionette.CompositeView.extend(config);
	}

	// Widget meta-data allows runtime / editor to inspect basic capabilities

	return {
	    "id": "Breadcrumbs",
        "label": "Breadcrumbs",
        "comment": "A widget used to show heirarchy between content",

        "triggers": [ "action", "select" ],
        "mixins": [ "isSelectable", "isActionable", "isDroppable" ],
        "collection": true,
        "options": true,
        "views": true,

        "fn": ux.view.Breadcrumbs
    }
})
