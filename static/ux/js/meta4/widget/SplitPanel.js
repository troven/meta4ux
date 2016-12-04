define(["jquery", "underscore", "backbone", "marionette", "ux"], function ($,_, Backbone, Marionette, ux) {

    ux.view.SplitPanel = ux.view["meta4:ux:SplitPanel"] = function(options) {
		options = ux.checkOptions(options, ["id"]);
		var DEBUG = true || ux.DEBUG;

		options.template =  options.template || ux.compileTemplate("<div class='col-sm-4 split-master'></div><div class='col-sm-8 split-detail'></div>");

		var config = {
			isNested: true, isNavigator: false,
	 		template: options.template,
		 	regions: { master: ".split-master" , detail: ".split-detail" },
		 	events: { },
			initialize: function(_options) {
			    _options.views.detail = _options.views.empty || _options.views.detail
			    _options.views.selected = _options.views.selected || _options.views.detail
				ux.initialize(this, _options)
DEBUG && console.log("SplitPanel: (%s) %o %o", this.id, this, _options)
				return this;
			},
			onRender: function() {
			    this.showNested()
			    var self = this
DEBUG && console.log("onRender: (%s) %o", this.id, this)

                var master = this.master.currentView
			    master.on("childview:select", function() {
			        self.doSelectDetail.apply(self, arguments)
			    })
			},
			doSelectDetail: function(v,m) {
			    var view = this.getNestedView("selected", { model: m })
DEBUG && console.log("doSelectDetail: (%s) %o %o -> %o", this.id, v, m, view)
			    view && this.detail.show(view)
			}
		}

		return Backbone.Marionette.LayoutView.extend(config)
	}

	// Widget meta-data allows runtime / editor to inspect basic capabilities

	return {
        "id": "SplitPanel",
        "label": "Split Panel",
        "comment": "A simple layout suited for displaying master/detail",
        "emits": [],
        "mixins": [ "isNavigator", "isNested" ],
        "views": true,
        "collection": true,
        "options": true,
        "schema": false,

        "fn": ux.view.SplitPanel
    }

})
