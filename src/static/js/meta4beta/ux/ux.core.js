define(["jquery", "underscore", "marionette", "Handlebars", "core",
	"meta4beta/ux/ux.dialog", "md5", "bootstrap_tour"

], function ($,_, Marionette, Handlebars, core, ux) {


	// ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
	var ViewRegistry = Backbone.Model.extend({

	/**
	 * Cache the View definitions in a Backbone Model.
	 * @method
	 * @param {string} id - the unique identity of the View.
	 * @param {string} options - the definition of the View.
	 */
		register: function(id, options) {
			if (this.get(id)) throw new Error("meta4:ux:register:oops:duplicate-view#"+id);
			return this.set(id,options)
		},

	/**
	 * Instantiate a named View.
	 * @method
	 * @param {string} id - the unique identity of the View.
	 * @param {string} options - the definition of the View.
	 */
		view: function(id, _options) {
			var widget = false;
			// resolve the arguments
            if (!id) throw "meta4:ux:oops:missing-view-id";

            // objects are cloned, then instantiated directly
			if (_.isObject(id)) {
				if (!id.id) throw new Error("meta4:ux:oops:missing-id");
				_options = _.extend({}, id, _options)
				id = id.id
				widget = core.ux.Widget(_options);
			} else if (_.isFunction(id)) {
			    // functions
				widget = id(_options);
			} else if (_.isString(id)) {
                _options = _.extend({}, this.get(id), _options);
				widget = core.ux.Widget(_options);
			}
			if (!widget) throw new Error("meta4:ux:oops:invalid-view#"+id);
			var module = core.ux._module;

			// listen to all events
			widget.on("all", function() {
				module.trigger.apply(module, arguments);
			})
			return widget
		},
	})

	// ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
	/**
	 * Cache widget meta-data. Resolve embedded widget() function.
	 * @constructor
	 */

	var WidgetRegistry = Backbone.Collection.extend({
		idAttribute: ux.idAttribute,

	/**
	 * Catch duplicates
	 * @method
	 * @param {string} id - the unique identity of the View.
	 * @param {string} options - the definition of the View.
	 */
		register: function(options) {

			if (!_.isString(options.id))
				throw new Error("meta4:ux:oops:widget:register:missing-id");

			if (this.get(id))
				throw new Error("meta4:ux:oops:widget:register:duplicate-widget#"+id);

			return this.set(id,options)
		},
		// retrieve a function that will instantiate a View
		widget: function(id) {
			if (_.isObject(id)) id = id[ux.typeAttribute]
			if (!_.isString(id))
				throw new Error("meta4:ux:widget:oops:invalid-id");
			var _widget = this.get(id);
			if (!_widget) return null
			var fn = _widget.get("fn")
			if (!_.isFunction(fn))
				throw new Error("meta4:ux:widget:oops:missing-fn");
//console.log("gotWidget: %s %o", id, fn)
			return fn
		}
	})

	// ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
	/*
		Moustache template helper.
	*/

	var TemplateHelpers = {
        now: function() {
            return new Date();
        },
        _: function(that) {
//console.error("_: %o %o %o", this, that, this[that])
            return that?core.ux.uid(that):core.uuid();
        },
        "raw": function( field) {
console.log("RAW: %o %o %o", this, field, this[field])
            return _.isUndefined(this[field])?field:this[field]
        },
        uid: function(that) {
            return that?core.ux.uid(that):core.uuid();
        },
        url: function(field) {
            return encodeURIComponent(this[field]||field)
        },
        md5: function(that) {
            return md5(that)
        },
        i18n: function(that) {
throw "i18n not implemented: "+that
        },
        gravatar: function(that) {
            return "http://www.gravatar.com/avatar/"+md5(that.trim().toLowerCase())
        },
        img: function(that, className) {
            if (_.isObject(that)) {
//console.log("icon: %o %o", this,that)
                return this.img;
            }
            className = _.isString(className)?className:"pull-right"
            return "<img height='48' class='"+className+"' src='/www/assets/images/"+that+".png'/>"
        },
        toString: function( x ){
            if ( x === void 0 ) return 'undefined';
            if (_.isArray(x)) return "[]"+x;
            if (_.isObject(x)) return "{}"+x;
            return x.toString();
        },
        lookup: function( field, collection ) {
            var models = core.fact.models.get(collection)
            if (!models) return "no models @ "+collection
            var model = models.get(this)
            if (!model) return "no "+this+" in "+collection;
            return model.get(field);
        },
        default: function( field, _default ) {
            return _.isUndefined(this[field])?_default:this[field]
        }
    }

	// ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
	/*
		Define the UX Mediator object
	*/
	_.extend(ux, {
		views: new ViewRegistry(),
		templates: {}, view: {}, widgets: new WidgetRegistry(),

		boot:function(module, options) {
			if (!module)
				throw new Error("meta4:ux:boot:oops:missing-module");
			var self = this;
			self._module = module;

			// compile HTML templates
			_.each(options.templates, function(template, id) {
				self.templates[id] = self.compileTemplate(template)
			});

			// register Template helpers
			_.each(core.ux.templateHelpers, function(fn,name) {
				Handlebars.registerHelper(name,fn)
			})

            // load all widgets
			this.registerWidgets(options, function() {
				module.trigger("ux:boot", self, options)
			})

		},

		registerWidgets: function(options, cb) {
			var widgetTypes = []
			var viewURL = options.url
			var self = this

			// Register View configurations
			var registerViews = function(options, views) {
				if (!views) return

				_.each(views, function(view, id) {
					if (!_.isEmpty(view)) {
						if (view.id) {
							self.views.register( view.id, view )
						}
                        // try our best to resolve something
						var widgetType = view[ux.typeAttribute] || view.widget || view.type || "Template"
						var path = view.require?view.require:viewURL+"/js/meta4beta/widget/"+widgetType+".js"
						// add require.js paths
						if (path && widgetTypes.indexOf(path)<0) widgetTypes.push(path)
						// views and tabs
						registerViews(view, view.views)
						registerViews(view, view.tabs)
					}
				})
			}

			// recursively register all views
			registerViews(options, options.views)
//DEBUG && console.warn("Requires Widgets: %o", widgetTypes)

			// uses require.js to load Widgets and cache meta-data,
			require(widgetTypes, function() {
				_.each(arguments, function(widget, i) {

					if (!widget.id)
						throw new Error(widgetTypes[i]+ " is missing {{id}}")

					if (!_.isFunction(widget.fn))
						throw new Error(widget.id+ " not a valid Widget fn()")

					self.widgets.add(widget)
//ux.DEBUG && console.warn("Widget (%s) %o -> %o", widget.id, self.widgets, self.widgets.widget(widget.id))
				})
console.warn("Loaded Widgets: %o", ux.widgets)
				cb && cb()
			})

		},

		// Compile a string template into a Handlebars function
		compileTemplate: function(template){
			return Handlebars.compile(template)
		},

		// Handlebar's Helpers
		templateHelpers: TemplateHelpers,

		// sanitize a string into an HTML id
		uid: function(id) {
			if (!id) throw "meta4:ux:oops:missing-id";
			return id.replace(new RegExp("[^A-Za-z0-9]", 'g'),"_");
		},

		// given a $dom element, find the associated model 'id'
		identity: function($el) {
			if (!$el) throw "meta4:ux:oops:missing-dom";
			// hunt for an ID (usually a model)
			var $id = false, id = false
			$id = $el.find("[data-id]")
			id = $id.attr("data-id")
			if (id) return id;

			$id = $el.find("[id]")
			id = $id.attr("id")
			if (id) return id;

			console.warn("Missing Identity: %o", $el)
			return null;
		},

		// attach 'this' attributes as HTML 'id' and RDFA 'about'
		identify: function($html, options) {
throw "deprecated"
			var that = options.get?options.get(ux.idAttribute):options[ux.idAttribute];
			var id = core.ux.uid(that);
			$html.attr("id", id);
			$html.attr("data-id", that);
			$html.attr("about", that);
		},

		// called by a Widget to intialize itself
		// injects Mixins, resolve models / collections
		// binds events to global functions
		// augment CSS classes
		//
		initialize: function(view, options) {
			if (!view) throw new Error("meta4:ux:oops:missing-view");
			if (!view.render) throw new Error("meta4:ux:oops:not-a-view");
			if (!options) throw new Error("meta4:ux:oops:missing-options");
			var _DEBUG = options.debug || ux.DEBUG
			core.ux.model(options, view)

			this.events = _.extend({}, this.events, this.options?this.options.events:{}, options.events)
			this.ui = _.extend({}, this.ui, options.ui)

			core.ux.mixer.call(view, options)
			core.iq.aware(view, options.when || options.iq)
		    core.ux.stylize(view, options);

//	        Backbone.View.prototype.delegateEvents.apply(this, options);

			return view;
		},

		// bind models (and collections) by reference (string), function an existing Backbone.Model or JSON options
		model: function(options, modelled) {
			return core.resolve(options, modelled)
		},

		// resolve look-up values using a variety of strategies - always returning an array of the form [{ id, label }]
		lookup: function(values) {
			if (_.isArray(values)) {
				values = _.map(values, function(v) { return _.isObject(v)?v:{ id: v, label: v} })
ux.DEBUG && console.log("Array Lookup: %o", values)
				return new Backbone.Collection(values);
			} else if (_.isObject(values)){
				values = _.map(values, function(v,k) { return _.isString(v)?{ id: k, label: v}:v })
ux.DEBUG && console.log("Object Lookup: %o", values)
				return new Backbone.Collection(values);
			} else if (_.isString(values)) {
//DEBUG &&
console.log("Named Lookup: %o -> %o", values, core.fact)
				return core.fact.models.get(values)
			} else  {
				return new Backbone.Collection(values)
			}
		},

		// augment view with absolute 'className' or cumulative 'css' styles
		stylize: function() {
		    var css = ""
		    var className = ""
		    _.each(arguments, function(v) {
		        css = css + (v.css?" "+v.css:"") // concat all CSS modification
		        className = v.className?v.className:className // last matching takes precedence
		    })
		    var self = arguments[0]
		    className = className + css
		    if (self.$el && className) {
		        self.$el.addClass(className)
		    }
//		    self.className = className + css
			return css;
		},

		// enforce required options, throw an exception if undefined
		checkOptions: function(options, required) {
			if (!options) throw new Error("meta4:ux:oops:missing-options");
			required = required || [ ux.idAttribute, ux.labelAttribute];
			for (var i = 0; i < required.length; i++) {
				var key = required[i];
				if (_.isUndefined(options[key])) {
					console.error("Missing '%s' for: %s in %o", key, options[ux.idAttribute], options);
					throw new Error("meta4:ux:oops:missing-option-"+key);
				}
			}
			return options;
		}
	});

	/* *****************************************************************************************************************
		UX factories
	**************************************************************************************************************** */

	core.ux.Widget = function(options) {
		if (!options) throw new Error("meta4:ux:widget:oops:missing-options");
		// functional options
		if (!_.isObject(options)) throw new Error("meta4:ux:widget:oops:invalid-options");

        // cloned options makes them naively immutable
		options = _.extend({}, { widget: "Template" }, options)
		var _DEBUG = options.debug || ux.DEBUG

		// obtain a Widget (aka Backbone.View) from global UX namespace
		var widgetType = options.widget || options.type
		var widgetClass = core.ux.widgets.widget(widgetType);

		if (!widgetClass) throw new Error("meta4:ux:oops:unknown-widget#"+widgetType);

		// get Widget instance
		var ViewClass = widgetClass(options);
_DEBUG && console.warn("ux.Widget: %s (%s) %o %o", options.id, widgetType, options, ViewClass)

		if (!ViewClass || !_.isFunction(ViewClass))
			throw new Error("meta4:ux:oops:invalid-widget#"+widgetType);

		// Marionette needs us to extend Widget to configure events & ui
		ViewClass = ViewClass.extend( _.pick(options, "events", "ui") )

        // Inherit from other widget
        if (options.extends) {
            var _extend = core.ux.view[options.extends]
            options = _.extends({}, _extend, options)
            console.log("EXTEND: %s %o", options.extends, _extend)
        }

		// resolve Model/Collections
		options = core.ux.model(options);

		// sanitize the 'ID' to keep the DOM happy
		options[ux.idAttribute] = core.ux.uid(options[ux.idAttribute]);

		// instantiate View
		var view = new ViewClass(options);

_DEBUG && console.debug("Widget View (%s @ %s): %o / %o", options[ux.idAttribute], widgetType, options, view);

        // deprecate - should be isModal mix-in
		if (options.modal || options.isModal)  {
			ux.Modal(view)
		}

		// refresh remote collections
		if (view.collection && options.fetch) {

			view.on("before:render", function() {
				var fields = _.pick(view.model.attributes, view.collection.options.parameters || ["id"] )
_DEBUG && console.debug("Fetch Widget (%s @ %s): %o", options[ux.idAttribute], widgetType, fields);
				view.collection.fetch( { debug: options.debug?true:false, filter: fields } )
			})

		}

		// show inline help ... TODO: reconsider this strategy
		if (options.help) {

			view.on("show", function() {
				var self = this
				var helpOptions = _.extend({ id: options[ux.idAttribute], type: "Help", template: options[ux.idAttribute]+".html" }, options.help)
				var HelpView = core.ux.view[helpOptions.type](helpOptions);
				var helpView = new HelpView(helpOptions);
				helpView.render()
				view.$el.parent().prepend(helpView.$el)
_DEBUG && console.debug("Help View: (%s) %o %o", options[ux.idAttribute], helpOptions, helpView);
			})

		}

		// inject a 'guided tour' feature ... TODO: fix it
		core.ux.tour(options)
		return view;
	}

	// ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
    // Various helper functions

	core.ux.position = {
		center: function($this, $parent) {
			$parent = $parent || $("body")
			var pWidth = $parent.width()
			var pHeight = $parent.height()
			var width = $this.width()
			var height = $this.height()
			var top = (pHeight - height)/2
			var left = (pWidth - width)/2
			$this.css({ "position": "absolute", "top": top, "left": left })
			return $this.position()
		},
		modal: function($this, $parent) {
			$parent = $parent || $(document)
			var pWidth = $parent.width()
			var pHeight = $parent.height()
			var width = $this.width()
			var height = $this.height()
			var top = (pHeight - height)/3
			var left = (pWidth - width)/2
			top = Math.max(top, 0)
			left = Math.max(left, 0)
			$this.css({ "position": "absolute", "top": top, "left": left })
// console.log("Position Modal: %o (%s x %s) @ (%s x %s) -> (%s x %s)", $this, width, height, pWidth, pHeight, top, left)
			return $this.position()
		}
	}

	// silence events
	core.ux.muffle = function(e) {
		e.stopImmediatePropagation()
		e.preventDefault()
	}

	// ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
	// guided tours
	core.ux.tour = function(options) {
		var tour = {}
		var follow = ["views", "tabs"]
		var $tour = $("#tourguide");
		if (!$tour||!$tour.length) {
			$tour = $("<ol id='tourguide'></ol>").appendTo("body")
		}

		var build = function(options) {
			if (_.isObject(options.tour)) {
				tour[options[ux.idAttribute]] = _.extend({label: "", comment: ""},options.tour)
			} else if (_.isString(options.tour)) {
				var id = options.tour.id || options[ux.idAttribute]
				tour[options[ux.idAttribute]] = { label: "", comment: options.tour }
			}
			_.each(follow, function(next) {
				if (options[next]) build(options[next])
			})
			return tour
		}

		var render = function(_tours) {
			_.each(_tours, function(_tour, id) {
				$("<li data-target='#"+id+"' data-title='"+_tour.label+"'>"+_tour.comment+"</li>").appendTo($tour)
			})
		}

		build(options)

		if (!_.isEmpty(tour)) {
			render(tour)

			$tour.featureTour({
				cookieMonster: false,
				cookieName: "tourGuide",
				nextOnClose: true,
				debug: true
			})
			console.log("Feature Tour: %o -> %o %o", $tour, options, tour)
		}
	}

	return core.ux
});
