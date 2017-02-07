define(["jquery", "underscore", "backbone", "marionette", "ux"], function ($,_, Backbone, M, ux) {

	ux.view.Breadcrumbs = ux.view["meta4:ux:Breadcrumbs"] = function(options) {
//		options = ux.checkOptions(options, ["id"]);
		var DEBUG = true;

        options.template =  options.template || ux.compileTemplate("<div class='breadcrumb-regions'><div class='breadcrumb-header'></div><div class='wrapper main'><div class='breadcrumb-body'>loading breadcrumb ...</div></div><div class='breadcrumb-footer'></div></div>");

        var CrumbItem = M.ItemView.extend( { tagName: "li", template: "<a href='#{{id}}'>{{label}}</a>" });
        var Crumbs = M.CollectionView.extend( { tagName: "ol", childView: CrumbItem } );

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
                var view = this.navigator.views.view( defn, meta, this.navigator );
                DEBUG && console.log("Breadcrumb %s show: %o -> %o", step, this, view)
                this.body.show(view);

                view.on("select", function(model) {
                    console.error("Breadcrumb: select: %o -> %o", this, arguments);
                    meta && self.collection.add(meta.model);
                    self.showCurrent();
                });
                view.on("action", function(action, meta) {
                    console.warn("Breadcrumb: %s action: %o -> %o", action, self, meta);
                    // meta && self.collection.add(meta.model);
                    // self.showCurrent();
                });
                view.on("navigate", function(go_to, model) {
                    console.error("Breadcrumb: %s navigate: %o -> %o", go_to, this, arguments);
                    meta && self.collection.add(model);
                    self.showCurrent();
                });
                view.on("nested:navigate", function() {
                    console.error("Breadcrumb: nested:navigate: %o -> %o", this, arguments);
                });

            },
            onShow: function() {
DEBUG && console.log("Breadcrumb onShow: %o", this)
                this.showNestedRegions();
                this.showCurrent();
                var crumbs = new Crumbs({ collection: this.collection });
                this.header.show(crumbs);
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

		return M.LayoutView.extend(config);
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
