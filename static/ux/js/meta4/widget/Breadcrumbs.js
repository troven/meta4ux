define(["jquery", "underscore", "backbone", "marionette", "ux"], function ($,_, Backbone, Marionette, ux) {

	ux.view.Breadcrumbs = ux.view["meta4:ux:Breadcrumbs"] = function(options) {
//		options = ux.checkOptions(options, ["id"]);
		var DEBUG = true;

        options.template =  options.template || ux.compileTemplate("<div class='breadcrumb-regions container'><div class='breadcrumb-header'></div><div class='wrapper main'><div class='breadcrumb-body'>loading breadcrumb ...</div></div><div class='breadcrumb-footer'></div></div>");

		var config = {
			isTemplating: true, isActionable: true, isNested: true,
			isSelectable: true, isHoverPanel: false,
			isPopOver: false, isActionMenu: false,
	 		template: options.template,
            regions: { header: ".breadcrumb-regions>.breadcrumb-header" , body: ".breadcrumb-regions>.main>.breadcrumb-body", footer: ".breadcrumb-regions>.breadcrumb-footer" },
			initialize: function(options) {
				_.defaults(options, { model: true });

                this.trail = _.map(options.trail, function(v) {return v});
                DEBUG && console.log("Breadcrumb Trail: %o -> %o", this, this.trail);

				ux.initialize(this, options);
				this.collection = new Backbone.Collection();

				this.resetTrail();
			},
            showCurrent: function(step) {
			    var self = this;
                step = _.isUndefined(step)?this.collection.length-1:step;
                if (step>=this.trail.length) {
                    this.resetTrail();
                    step = 0;
                }

                var defn = this.trail[step];
                var meta = { model: this.navigator.state };
                var view = this.getNestedView( defn, meta, this.navigator );
                DEBUG && console.log("Breadcrumb %s Show: %o -> %o", step, this, view)
                this.body.show(view);
                view.on("select", function() {
                    console.error("Breadcrumb: select: %o -> %o", this, arguments);
                })
                view.on("action", function(action, meta) {
                    console.error("Breadcrumb: action: %o -> %o", self, meta);
                    meta && self.collection.add(meta.model);
                    self.showCurrent();
                })
                view.on("navigate", function() {
                    console.error("Breadcrumb: navigate: %o -> %o", this, arguments);
                })

            },
            onShow: function() {
DEBUG && console.log("Breadcrumb onShow: %o", this)
                this.showNestedRegions();
                this.showCurrent();
            },
            resetTrail: function() {
DEBUG && console.log("Breadcrumb Home: %o", this)
				this.collection.reset();
				this.collection.add( { id: 'home', label: options.label || "Home" } );
                return 0;
			},
			onBreadcrumb: function(go_to, view) {
				if (go_to && view && view.model) {
					if (go_to.indexOf("/")<0) this.onBreadcrumbHome();
					var attrs = view.model.attributes.label?view.model.attributes:view.options
					attrs.label && this.collection.add(attrs)
DEBUG && console.log("Breadcrumb: %o (%s) -> %o %o", this, view.id, view, attrs)
				}
			},
            onRender: function() {

            }
		}

		return Backbone.Marionette.LayoutView.extend(config);
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
