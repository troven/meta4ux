define(["jquery", "underscore", "backbone", "marionette", "core", "ux",
"jmpress"], function ($,_, Backbone, Marionette, scorpio4, ux, jmpress) {

	var idAttribute = ux.idAttribute || "_id";
	var typeAttribute = ux.typeAttribute || "_type";
	var SCALE = 120;

	ux.view.Dashboard3D = ux.view["meta4:ux:Dashboard3D"] = function(options) {
		options = ux.checkOptions(options);
		options = _.extend({viewFacet: "type", viewable: {} }, options);
		var DEBUG = true;

		var ViewStep = Backbone.Marionette.ItemView.extend( {
			className: "ux_view step",
			templateHelpers: ux.mixin.Common.templateHelpers,
			template: "<div class='slide' data-id='{{"+idAttribute+"}}' title='{{comment}}'>{{label}}</div>"
		} );

		var Dashboard3D = Backbone.Marionette.CollectionView.extend(_.extend({
			className: "ux_dashboard3d hide",
			axis: options.axis,
			triggerMethod:   Marionette.triggerMethod,
			initialize: function() {
				var self = this;
				ux.model(options,this);
				this.setLayout(options.layout || "Timewarp")
				this.initializeCoords();
				this.listenTo(this.collection, "fetch", self.onShow)
			},
			setLayout: function(layout) {
				if (_.isString(layout)) {
					this.layout = this["layout"+layout]; // named-lookup
				} else if (_.isFunction(layout)) {
					this.layout = layout;
				} else throw "meta4:ux:dashboard3d:oops:invalid-layout#";
			},
			// override: get the item view
  			getChildView: function(model) {
				var viewOptions = Marionette.getOption(this, "childViewOptions") || {};
				viewOptions.model = model;
				var type = model.get(options.viewFacet) || model.id;
//				if (!type) throw "meta4:ux:oops:missing-view-facet";
				var childView = options.viewable[type] || ViewStep;
				DEBUG && console.log("3D View Type:", type, model, childView )
//				if (!childView) throw "meta4:ux:oops:missing-view#"+type;
//				return childView(viewOptions);
				return childView;
			},
			// override: render the item view
			renderChildView: function(view, index) {
				view.render();
				var that = view.model.id || ux.uuid();
				DEBUG && console.log("3D Render Item:", this, that, view, index)

				var uid = ux.uid( that );
				var coords = this.getChildViewCoords(view, index);
				view.$el.attr("id", uid);

                this.positionChildView(view, coords);
				this.attachHtml(this, view, index);
			},
			positionChildView: function(view, coords) {
				if (!view) throw "meta4:ux:oops:missing-view#";
				if (!view.model) throw "meta4:ux:oops:missing-view-model#";
				if (!coords) throw "meta4:ux:oops:missing-coords#";
				view.$el.attr("data-x", coords.x || 0 );
				view.$el.attr("data-y", coords.y || 0 );
				view.$el.attr("data-z", coords.z || 0 );
				view.$el.attr("data-scale", coords.scale  || 1 );
				if (coords.rotate) {
					view.$el.attr("data-rotate", coords.rotate);
				} else if ( coords.rx || coords.ry || coords.rz ) {
					view.$el.attr("data-rotate-x", coords.rx || 0 );
					view.$el.attr("data-rotate-y", coords.ry || 0 );
					view.$el.attr("data-rotate-z", coords.rz || 0 );
				}
				return this;
			},
			getChildViewCoords: function(view, index) {
				var that = view.model.id;
				var coords = this._coordsByModel[that] || this.layout(view.model, index, null);
				console.log("getChildViewCoords()", coords, that, view)
				return coords;
			},
			initializeCoords: function( _collection ) {
				var self = this;
				_collection = _collection || this.collection;
				this._coordsByModel = {};
				this.triggerMethod("before:layout", _collection );
				_collection.each(function(model,models,ix) {
					var that = model.id;
					var coords = self._coordsByModel[that] = self.layout(model,models,ix);
					if (options.follow) {
						var followed = model.get(options.follow);
						if (followed && followed instanceof Backbone.Collection ) self.initializeCoords( followed );
					}
				});
				this.triggerMethod("layout", _collection );
			},
			// Timewarp layout.
			layoutTimewarp: function(model, ix, collection) {
				var coords = { x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0, scale: 1 }
				coords.x = SCALE*ix; // Math.round((ix/7)*200);
				coords.y = (ix%7)*SCALE; // Math.round((ix%7)*200);
				coords.z = Math.round(ix*ix*SCALE);
				coords.scale = 1;
				coords.rotate = ix*25;
console.log("layoutTimewarp() ", coords, model, ix, collection)
				return coords;
			},
			// default layout. TODO: make it better
			layoutDefault: function(model, ix, collection) {

				var coords = { x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0, scale: 1 }
				coords.x = SCALE*ix; // Math.round((ix/7)*200);
				coords.y = (ix%7)*SCALE; // Math.round((ix%7)*200);
				coords.z = Math.round(ix*SCALE);
				coords.scale = 1;
				coords.rotate = ix*20;
console.log("layoutDefault() ", coords, model, ix, collection)
				return coords;
			},
			layoutRacks: function(model, ix, collection) {

				var coords = { x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0, scale: 1 }
				coords.x = SCALE*ix; // Math.round((ix/7)*200);
				coords.y = Math.round((ix%7)*SCALE);
				coords.z = Math.round(ix*SCALE*2);
				coords.scale = 1;
				coords.rotate = 1; // ix*20;
console.log("layoutRacks()", coords, ix, collection)
				return coords;
			},
			layoutModel: function(model, ix, collection) {
				return _.extend({ x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0, scale: 1 }, model.toJSON());
			},
			onShow: function(x) {
				this.activated3D = false;
				var self = this;
				setTimeout( function() { self.activate3D.apply(self, x) }, 10);
			},
			activate3D: function() {
				var self = this;
				DEBUG && console.debug("Activating 3D:", this, this.$el)
				this.$el.jmpress({
//					stepSelector: '.step',
					fullscreen: false, // or container mode
					viewPort: {
						width: 800,
						height: 600,
					},
					animation: _.extend({
						transformOrigin: 'center center', // Point on which to transform (unused)
						transitionDuration: '1s',         // Length of animation
						transitionDelay: '50ms',         // Delay before animating
						transitionTimingFunction: 'ease'  // Animation effect
					}, options.animation ),
					transitionDuration: 10,
					setActive: function( element, eventData ) {
						var $dom = $("[data-id]", eventData.delegatedFrom);
						var that = $dom.attr("about");
						var model = self.collection.get(that);
						self.triggerMethod("select", model);
						self.$el.off("click.ux_activate");
						self.$el.on("click.ux_activate", function(ui,event){
DEBUG && console.log("Trigger 3D Active", self, $(this), ui, event, model );
							self.triggerMethod("activate", model);
						})
					}
				});
				this.$el.on("enterStep", function(event) {
DEBUG && console.log("Enter 3D Step", self, event, $(this));
				    self.triggerMethod("step:enter", event);
				})
				this.$el.on("leaveStep", function(event) {
DEBUG && console.log("Leave 3D Step", self, event, $(this));
				    self.triggerMethod("step:leave", event);
				})
				this.$el.fadeIn();
				this.activated3D = true;
//				this.triggerMethod("activate" );
				return this;
			},
			select: function(selected) {
				if (!this.activated3D) {
					return;
				}
				this._select(selected);
			},
			_select: ux.mixin.Selectable.select,
			selectItem: function(model) {
				var uid = ux.uid( model.id );
console.log("Select 3D Item:",this, uid, model);
				this.$el.jmpress("select", "#"+uid);
			}
		}, ux.mixin.Common));
		return Dashboard3D;
	}

	// Widget meta-data allows runtime / editor to inspect basic capabilities

	return {
	    "id": "Dashboard3D",
        "label": "Dashboard3D",
        "comment": "A 3D presentation widget that controls the layout of a collection  of individual panels.",
        "triggers": [ "transition", "select", "action" ],
        "can": [ "read" ],
        "mixins": [ "isNested", "isActionable" ],
        "views": true,
        "collection": true,
        "options": true,

        "fn": ux.view.Dashboard3D
    }

})

