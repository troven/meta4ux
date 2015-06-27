define(["jquery", "underscore", "backbone", "marionette", "ux"], function ($,_, Backbone, Marionette, ux) {

	ux.view["meta4:ux:Dashboard"] = function(options) {
		options = ux.checkOptions(options, ["this", "label"]);
		var follow_this = options.follow;
		var DEBUG = false;

		/** Gizmo **/
		var Gizmo = Backbone.Marionette.CompositeView.extend({
			initialize: function(_options) {
				this.collection = this.model.get(follow_this);
				var View = ux.view[options.widget];
				var view_options = _.extend(options.gizmo,_options)
				this.view = new View(view_options);
				DEBUG && console.debug("Init Dash Gizmo", this, _options);
			},
			initialize: function(_options) {
				DEBUG && console.debug("Init Gizmo", this, _options)
			},
			appendHtml: function($el,iv) {
				DEBUG && console.debug("Append Gizmo", this, $el, iv)
				$el.$("li:first").append(iv.el);
			},
			onRender: function() {
				DEBUG && console.warn("Gizmo onRender", this, _options)
			},
			tagName: "li", className: ux.stylize("ux_gizmo", options),
			template: "<span class='ux_gizmo_header selectable' data-id='{{id}}' title='{{comment}}'><i class='pull-right icon icon-minus'></i>{{label}}<div class='ux_gizmo_body'></div></span>"
		});

		var Dashboard = Backbone.Marionette.CompositeView.extend( _.extend({
			itemView: Gizmo,
			tagName: "div", template: "<span data-id='{{id}}' title='{{comment}}'>{{label}}<ul class='ux_dashboard'></ul></div>", itemViewContainer: "ul",
			events: {
			  'click .selectable': 'doEventSelect'
			},
			initialize: function(_options) {
				DEBUG && console.debug("Init Dash Root", this, _options);
			},
			onItemviewShow: function () {
				var $nodes = ux.factualize(this, options.factualizer );
				$( ".ux_dashboard", this.$el ).sortable( _.extend({
					connectWith: ".ux_dashboard"
				}, options.sortable) );
   //				$( ".ux_dashboard", this.$el ).resizable();

				$( ".icon-menu", this.$el ).click(function() {
					$( this ).toggleClass( "icon-minus" ).toggleClass( "icon-plus" );
					$( this ).parents( ".ux_gizmo" ).find( ".ux_gizmo_body" ).toggle();
				});

				$( ".ux_dashboard" ).disableSelection();

				return this;
			}
		}, ux.mixin.Common ) );

		return Dashboard;
	}


	// Widget meta-data allows runtime / editor to inspect basic capabilities

	return {
	    "id": "Dashboard",
        "label": "Dashboard",
        "comment": "",
        "triggers": [ "transition", "select", "action" ],
        "can": [ "create", "read", "update", "delete" ],
        "mixins": [ "isNested", "isActionable" ],
        "views": true,
        "collection": true,
        "options": true,

        "fn": ux.view.Dashboard
    }


})
