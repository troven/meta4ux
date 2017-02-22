define(["jquery", "underscore", "backbone", "marionette", "ux"], function ($,_, Backbone, M, ux) {

	ux.view.Breadcrumbs = ux.view["meta4:ux:Breadcrumbs"] = function(options) {
//		options = ux.checkOptions(options, ["id"]);
		var DEBUG = true;

        options.template =  options.template || ux.compileTemplate("<div class='breadcrumb-regions'><div class='breadcrumb-header'></div><div class='wrapper main'><div class='breadcrumb-body'>loading breadcrumb ...</div></div><div class='breadcrumb-footer'></div></div>");

        var CrumbItem = M.View.extend( { tagName: "li", className: "breadcrumb-item", template: "<a href='#{{id}}'>{{label}}</a>" });
        var Crumbs = M.CollectionView.extend( { tagName: "ul", className: "breadcrumb", childView: CrumbItem } );

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
                //DEBUG &&
                console.log("%s Breadcrumb %s show: %o -> %o", (view.isModal?"Modal":"Region"), step, this, view)

                if (view.isModal)  {
                    this.navigator.Modal(view);
                } else {
                    this.showChildView("body",view);
                }

                view.on("select", function(model) {
                    console.error("Breadcrumb: select: %o -> %o", self, arguments);
                    meta && self.collection.add(meta.model);
                    self.showCurrent();
                });
                view.on("action", function(action, action_meta) {
                    console.warn("Breadcrumb: %s action: %o -> %o", action, view, action_meta);
                    if (action=="select") {
                        view.trigger("select", action_meta);
                    }
                    // meta && self.collection.add(action_meta.model);
                    // self.showCurrent();
                });
                view.on("navigate", function(go_to, model) {
                    console.error("Breadcrumb: %s navigate: %o -> %o", go_to, this, arguments);
                    meta && self.collection.add(model);
                    self.showCurrent();
                });
                view.on("nested:navigate", function() {
throw "x"
                    console.error("Breadcrumb: nested:navigate: %o -> %o", this, arguments);
                });

            },
            onAttach: function() {
DEBUG && console.log("Breadcrumb onAttach: %o", this)
                this.showNestedRegions();
                this.showCurrent();
                var crumbs = new Crumbs({ collection: this.collection });
                this.showChildView("header", crumbs);
            },
            resetTrail: function() {
DEBUG && console.log("Breadcrumb Home: %o", this)
				this.collection.reset();

                var homeHash = window.location.hash?window.location.hash.substring(1):"views:home";
				this.collection.add( { id: homeHash, label: "Home" } );

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

		return M.View.extend(config);
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
