define(["jquery", "underscore", "backbone", "marionette", "ux"], function ($,_, Backbone, Marionette, ux) {

	var DEBUG = true && ux.DEBUG;

	// Navigation Bar

	var NavBar = ux.view.NavBar = ux.view["meta4:ux:NavBar"] = function(options) {
		options = ux.checkOptions(options); // sanity check ('this', 'label')

		var MenuToggle = Backbone.Marionette.CompositeView.extend( _.extend({
			initialize: function(_options) {
DEBUG && console.log("MenuToggle", this, _options);
			},
			childView: MenuToggle,
			childViewContainer: "ul.dropdown-menu", className: "dropdown",
			events: { "click [data-id]": "onSelect"},
			tagName: "li", template: "<a class='selectable dropdown-toggle' data-toggle='dropdown' data-id='{{id}}' title='{{label}}'>{{label}}</a><ul class='dropdown-menu'></ul>"
		}, ux.mixin ) );

		var MenuBar = Backbone.Marionette.CollectionView.extend({ childView: MenuToggle, tagName: "ul", className: "nav" });


		var NavBar = Backbone.Marionette.ItemView.extend({
			tagName: "div",
			className: "navbar",
			template: "<div class='navbar-inner'><b class='brand'>{{label}}</b><span class='ux_menu'></span><span class='ux_search'></span></div>",
			searchTemplate: "<div class='navbar-search pull-right'><input id='search-query' class='search-query' type='text' placeholder='search' size='8'/></div>",
			initialize: function() {
				var self = this;

				ux.model(options, this);
DEBUG && console.log("NavBar:", this, options);
				this.menuView = new MenuBar( { model: this.model, collection: this.collection } );
				this.listenTo(this.menuView, "all", function(event, that, x, y, z) {
DEBUG && console.log("On NavBar:", this, event, that);
                    this.triggerMethod("menu:"+event, that, x, y, z);
				})
			},
			onRender: function() {
				var self = this;

				var $menu = this.$el.find(".ux_menu");
				$menu.replaceWith( this.menuView.render().el );

//				this.$el.find(".ux_search").replaceWith(Mustache.to_html(this["searchTemplate"], options));

DEBUG && console.log("Searching:", options.search)
				if (options.search) {
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

})
