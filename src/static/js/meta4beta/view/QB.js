define(["jquery", "underscore", "backbone", "marionette", "ux",
    "qb", "qbd"
], function ($,_, Backbone, Marionette, ux, qb, qbd) {

	var DEBUG = true

	ux.view.QB = ux.view["meta4:ux:QB"] = function(options) {
        return Backbone.Marionette.ItemView.extend({
            tagName: "li", template: false,
			initialize: function(_options) {
				ux.initialize(this, _options)
				_.defaults(_options, { responseAccessor: "scorpio4" })
			},
            onRender: function() {
                var config = _.extend({}, this.options)
                var lookUps = this.getLookUps(config)
DEBUG && console.log("Render QB Dash (%s): %o %o", config.id, this, config)
                config.id = ux.uid("qb_"+config.id)
                config.el = this.$el
                var dash = new qbd({ labels: lookUps } );
                var params = this.model?{ id: this.model.id }: {}
                dash.show(config, params)
            },
            getLookUps: function(config) {
                var lookUps = {}
                _.each(config.lookups, function(v,k) {
                	if (_.isString(v)) {
                		var labels = ux.fact.models.get(v);
                		var lookup = {}
                		labels.each(function(label) {
                			lookup[label.id] = label.get("label")
                		})
                		lookUps[k] = lookup
DEBUG && console.log("QB Lookup (%s): %o %o", k, labels, lookup)
                	} else if (_.isObject(v)) {
                		var labels = ux.fact.models.get(v.collection);
                		var lookup = {}
						var template = ux.compileTemplate(v.template)
                		labels.each(function(label) {
                			lookup[label.id] = template(label.toJSON())
                		})
                		lookUps[k] = lookup
DEBUG && console.log("QB Template Lookup (%s): %o %o", k, labels, lookup)
                	}
                })
                return lookUps;
            }
        })
    }

	ux.view.QBs = ux.view["meta4:ux:QBs"] = function(options) {
//		options = ux.checkOptions(options, ["id"]);
		var DEBUG = true;
        var DashView = ux.view.QB()

		var config = {
			isTemplating: false, isActionable: false, isSortable: true,
			isNavigator: false, isSelectable: false, isHoverPanel: false,
			isPopOver: false, isActionMenu: true,
            template: options.template || "<div data-id='{{id}}' >{{label}}<ul class='nav nav-tabs'></ul></div>",
            childViewContainer: "ul", childView: DashView,
			events: {
				"click [data-id]": "doEventSelect",
				"click [data-action]": "doAction",
				"click [data-navigate]": "doNavigate"
			},
			className: "qb",
			initialize: function(options) {
				ux.initialize(this, options)
DEBUG && console.log("QB (%s) init: %o %o", options.id, this, options)
			}
		}

		return Backbone.Marionette.CompositeView.extend(config);
	}

	// Widget meta-data allows runtime / editor to inspect basic capabilities

	return {
	    "id": "QB",
        "label": "QB",
        "comment": "An interactive analytics widget",
        "emits": [],
        "mixins": [],
        "views": false,
        "collection": false,
        "options": true,
        "schema": false,

        "fn": ux.view.QB
    }

})
