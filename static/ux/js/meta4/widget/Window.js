define(["jquery", "underscore", "backbone", "marionette", "ux"], function ($,_, Backbone, Marionette, ux) {

	ux.view.Window = ux.view["meta4:ux:Window"] = function(options) {
//		options = ux.checkOptions(options, ["id"]);
		var DEBUG = true;

		options.template =  options.template || ux.compileTemplate("<div class='modal-regions'><div class='modal-header'></div><div class='modal-body'></div><div class='modal-footer'></div></div>");

		var config = {
			isTemplating: true, isActionable: true, isNested: true,
			isNavigator: false, isSelectable: false, isHoverPanel: false, isPopOver: false, isActionMenu: false,
            regions: { header: ".modal-regions>.modal-header" , body: ".modal-regions>.modal-body", child: ".modal-regions>.modal-body", footer: ".modal-regions>.modal-footer" },
			events: { },
			initialize: function(options) {
				_.defaults(options, { model: false, collection: true })
				ux.initialize(this, options)
			},
			getEl: function() {
    			this.$el = $("<div class='window'/>");
    			this.$el.prependTo( $("body") )
    			return this.$el;
			},
			onRender: function() {
				var self = this
//                if (this.options.dialog) this.$el.addClass("fade")
DEBUG && console.log("onShow: %o %o", this, this.body)
//				this.on("navigate", self.onNavigate);
				if (!this.body.currentView) {
					var view = this.showNested(this, { model: this.model, collection: this.collection })
				}
			},
		}

		return Backbone.Marionette.LayoutView.extend(config);
	}

	// Widget meta-data allows runtime / editor to inspect basic capabilities

	return {
        "id": "Window",
        "label": "Window",
        "comment": "A move-able, modal layout",
        "emits": ["action"],
        "mixins": [ "isTemplating", "isSortable", "isHoverPanel" ],
        "views": false,
        "collection": true,
        "options": true,
        "schema": false,

        "fn": ux.view.Window
    }
})
