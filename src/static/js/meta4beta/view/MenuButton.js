define(["jquery", "underscore", "backbone", "marionette", "ux"], function ($,_, Backbone, Marionette, ux) {


	ux.view.MenuButton = ux.view["meta4:ux:MenuButton"] = function(options) {

    	var DEBUG = options.DEBUG || ux.DEBUG;

        // each Button

		var ButtonItem = Backbone.Marionette.ItemView.extend({ tagName: "li",
			template: "<a data-trigger='{{id}}' data-navigate='{{id}}' title='{{comment}}' href='#{{id}}'>{{label}}</a>",
		});

        // UX Definition
		var definition = _.extend({

			isCommon:true, isActionable: true,
			model: true,

			template: "<span class='btn-group'><button class='btn dropdown-toggle' data-toggle='dropdown'>{{label}}</button><ul class='dropdown-menu'></ul></span>",
			className: "btn-toolbar", tagName: "div",
			childView: ButtonItem, childViewContainer: "ul",

			events: _.extend({
			  'click [data-trigger]': 'doEventAction'
			}, options.events ),

			initialize: function(options) {
				ux.checkOptions(options, ["collection"]);
				ux.initialize(this, options);
			},

			onAction: function(action, options) {
				if (!options.model) throw "meta4:ux:oops:action:missing-model";
                // set our label to match
				var label = options.model.get(ux.labelAttribute);
				label && this.model.set(ux.labelAttribute, label);
				this.render();
			},

			onRender: function() {
				$('.dropdown-toggle', this.$el).dropdown();
			}

		}, options );

//        ux.define(Backbone.Marionette.CompositeView, definition)
        return Backbone.Marionette.CompositeView.extend( definition )
	}


return ux; })
