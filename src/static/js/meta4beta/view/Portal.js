define(["jquery", "underscore", "backbone", "marionette", "ux"], function ($,_, Backbone, Marionette, ux) {

    var idAttribute = ux.idAttribute || "id";
    var widgetAttribute = ux.widgetAttribute || "widget";
    var labelAttribute = ux.labelAttribute || "label";
    var commentAttribute = ux.commentAttribute || "comment"
    var DEBUG = true //&& ux.DEBUG;


	ux.view.Portal = ux.view["meta4:ux:Portal"] = function(options) {
//		options = ux.checkOptions(options, ["id"]);
		var DEBUG = true;

		var config = {
			isTemplating: true, isActionable: true,
			isNavigator: false, isSelectable: true, isHoverPanel: true,
			isPopOver: false, isActionMenu: true,
            template: options.template || "<div data-id='{{id}}'>{{label}}</div>",
			events: {
				"click [data-id]": "doEventSelect",
				"click [data-action]": "doAction",
                "click [data-trigger]": "doAction",
				"click [data-navigate]": "doNavigate"
			},
			initialize: function(options) {
				_.defaults(options, { model: false, portletAttribute: widgetAttribute })
console.log("PORTAL: %o %o", this, options)
				ux.initialize(this, options)

				if (!this.collection&&options.views) {
					this.collection = new Backbone.Collection(options.views)
				}
			},
			getChildView: function(_model) {
console.log("portalView: %o", _model)
			    var portletType = _model.get(this.options.portletAttribute)
			    if (!portletType) {
			        portletType = "Template"
    			    _model = _.defaults( _model, this.options.options )
			    }
				var ChildView = ux.view[portletType]
DEBUG && console.debug("getPortlet (%s): %o", portletType, _model)
				var childView = ChildView(_model)
				return childView;
			},

			childViewOptions: function(_model) {
			    var childOptions = _.extend( {}, this.options.options, _model.toJSON(), { model: this.model } );
DEBUG && console.debug("getPortlet options: %o %o %o", this, _model, childOptions)
			    return childOptions
			}
		}

		return Backbone.Marionette.CompositeView.extend(config);
	}

	// Widget meta-data allows runtime / editor to inspect basic capabilities

	return {
	    "id": "Portal",
        "label": "Portal",
        "comment": "A portal displays a custom view for each model in a collection",
        "emits": ["action" ,"navigate", "select"],
        "mixins": [ "isHoverPanel", "isSelectable", "isSortable", "isNavigator", "isActionable" ],
        "views": true,
        "collection": true,
        "options": true,
        "schema": false,

        "fn": ux.view.Portal
    }
})
