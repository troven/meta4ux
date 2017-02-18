define(["jquery", "underscore", "backbone", "marionette", "ux"], function ($,_, Backbone, Marionette, ux) {

	var DEBUG = true;

	// Navigation Bar

	var NavBar = ux.view.NavBar = ux.view["meta4:ux:NavBar"] = function(options, module) {
		options = ux.checkOptions(options); // sanity check ('this', 'label')
        if (!module) throw new Error("meta4:ux:NavBar:oops:no-module");

		var MenuItem = Backbone.Marionette.View.extend( _.extend({
			events: { "click": "doSelect"},
			tagName: "li", template: "<a href='#{{id}}' title='{{label}}'>{{label}}</a>",
            initialize: function(_options) {
                ux.initialize(this, _options);
            },
            doSelect: function() {
                this.$el.addClass("active");
			    this.trigger("select", this.model);
            }
		}, ux.mixin ) );

        // var MenuDropDown = Backbone.Marionette.View.extend( _.extend({
        //     initialize: function(_options) { },
        //     childViewContainer: "ul.dropdown-menu", className: "nav-item",
        //     events: { "click": "doSelect"},
        //     tagName: "li", template: "<a title='{{label}}'>{{label}}</a>",
        //     doSelect: function() {
        //         this.trigger("select", this.model);
        //     }
        // }, ux.mixin ) );

		var MenuList = Backbone.Marionette.CollectionView.extend({
		    childView: MenuItem, tagName: "ul", className: "nav navbar-nav",
            childViewEvents: {
                "select": function(model, event) {
                    this.$el.find(".active").removeClass("active");
                    this.selected = model;
                    console.log("NavBar: selected: %o %o %o", this, model);
                    // bubble navigate to ActionList parent
                    this.triggerMethod("select", model);
                }
            }
		});

		var NavBar = Backbone.Marionette.View.extend({
            isNavigator: true,
			tagName: "nav",
			className: "navbar navbar-default",
			template: "<div class='container-fluid'></div><div class='navbar-header'><span data-navigate='views:home' title='{{comment}}' class='clickable navbar-brand'>{{label}}</span></div><div class='collapse navbar-collapse ux_navbar_menu'></div></div>",
			searchTemplate: "<div class='navbar-search pull-right'><input id='search-query' class='search-query' type='text' placeholder='search' size='8'/></div>",
            events: {
                'click [data-navigate]': ''
            },
            childViewEvents: {
                "select": function(model, event) {
                    console.log("NavBar: select: %o %o %o", this, model);
                    // bubble navigate to ActionList parent
                    this.triggerMethod("select", model);
                }
            },
			initialize: function() {
				var self = this;

				ux.initialize(this, options);
DEBUG && console.log("NavBar: init", this, options);

				this.menuList = new MenuList( { model: this.model, collection: this.collection } );
                this.menuList.on("select", function(model) {
                    self.trigger("navigate", model.id);
                });
			},
			onRender: function() {
				var self = this;

				var $menu = this.$el.find(".ux_navbar_menu");
				$menu.replaceWith( this.menuList.render().el );

//				this.$el.find(".ux_search").replaceWith(Mustache.to_html(this["searchTemplate"], options));

				if (options.search) {
                    DEBUG && console.log("Searching: %o", options.search);
					var source_labels = _.pluck(options.search.toJSON(), "label");
					$('#search-query', self.$el).typeahead({ source: source_labels });
DEBUG && console.debug("Search:", self.$el, source_labels );
				}
//				this.$el.css( { position: "fixed" } );
			},

			doSelectMenu: function(that) {
DEBUG && console.log("menu select", this, that)
				this.trigger("select", that)
			}
		}, options);

		return NavBar;
	}

	// Widget meta-data allows runtime / editor to inspect basic capabilities

	return {
	    "id": "NavBar",
        "label": "Navigation Toolbar",
        "comment": "A list of Menu Buttons",
        "emits": ["action", "navigate"],
        "mixins": [ "isActionable", "isNavigator" ],
        "views": false,
        "collection": true,
        "options": true,
        "schema": false,

        "fn": NavBar
    }

});