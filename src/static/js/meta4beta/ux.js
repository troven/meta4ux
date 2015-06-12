define(["jquery", "underscore", "marionette", "Handlebars", "core",
	"ux_dialog", "md5", "bootstrap_tour"

], function ($,_, Marionette, Handlebars, core, ux) {


	// default to Moustache renderer
	Marionette.Renderer.render = function(template, data) { return _.isFunction(template)?template(data):Handlebars.compile(template)(data); }

    var ux = core.ux = core.ux || { DEBUG: true }
	ux.idAttribute = core.idAttribute || "id";
	ux.typeAttribute = core.typeAttribute || "widget";
	ux.labelAttribute = core.labelAttribute || "label";

	ux.DEBUG = false

    /*
       Hold all the View definitions in a Backbone Model
    */
	var ViewRegistry = Backbone.Model.extend({

		register: function(id, options) {
			if (this.get(id)) throw "meta4:ux:register:oops:duplicate-view#"+id;
			return this.set(id,options)
		},

		// e.g. core.ux.views.show("urn:my:view:to_do");
		show: function(id, options) {
throw "deprecated"
			if (!id) throw "meta4:ux:oops:missing-id";
			if (_.isObject(id) && !options) {
				options = id;
				id = options[ux.idAttribute]
			}
			var view = ux.views.widget(id,options);
			if (!view) throw "meta4:ux:oops:missing-view#"+id;
			(view.show && view.show()) || view.render()
			view.collection && view.collection.isEmpty() && view.collection.fetch(options);
			return view;
		},

		widget: function(id, _options) {
			var widget = false;
			// resolve the arguments
            if (!id) throw "meta4:ux:oops:missing-id";

            // objects are cloned, then instantiated directly
			if (_.isObject(id)) {
				if (!id.id) throw "meta4:ux:oops:missing-id";
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
			if (!widget) throw "meta4:ux:oops:invalid-view#"+id;

			var module = core.ux._module;

			// listen to all events
			widget.on("all", function() {
				module.trigger.apply(module, arguments);
			})
			return widget
		},
	})

	_.extend(core.ux, {
		views: new ViewRegistry, templates: {},
		view: {},

		boot:function(module, options) {
			if (!module) throw "meta4:ux:boot:oops:missing-module";
			var self = this;
			self._module = module;

			// compile HTML templates
			_.each(options.templates, function(template, id) {
				self.templates[id] = self.compileTemplate(template)
			});

			var widgetTypes = []
			var viewURL = options.url

			// register View configurations
			var registerViews = function(options, views) {
				if (!views) return

				_.each(views, function(view, id) {
					if (!_.isEmpty(view)) {
						if (view.id) {
							self.views.register( view.id, view )
						}
                        // try our best to resolve something
						var widgetType = view[ux.typeAttribute] || view.widget || view.type || "Template"
						var path = view.require?view.require:viewURL+"/js/meta4beta/view/"+widgetType+".js"
//console.warn("Require: %o %o", path, widgetTypes)
						if (path && widgetTypes.indexOf(path)<0) widgetTypes.push(path)
						registerViews(view, view.views)
						registerViews(view, view.tabs)
					}
				})
			}

			// recursively register all views
			registerViews(options, options.views)
//DEBUG && console.warn("Requires Widgets: %o", widgetTypes)

			// register template helpers
			_.each(core.ux.templateHelpers, function(fn,name) {
				Handlebars.registerHelper(name,fn)
			})

			require(widgetTypes, function() {
//DEBUG && console.warn("UX Widgets Loaded: %o %o %o", self, options, arguments)
				module.trigger("ux:boot", self, options)
			})

//DEBUG && console.warn("UX Configured: %o %o %o", self, module, options)
		},

		compileTemplate: function(template){
			return Handlebars.compile(template)
		},

		// Handlebar's Helpers
		templateHelpers: {
			now: function() {
				return new Date();
			},
			_: function(that) {
//console.error("_: %o %o %o", this, that, this[that])
				return that?core.ux.uid(that):core.uuid();
			},
			uid: function(that) {
				return that?core.ux.uid(that):core.uuid();
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
		},

		// sanitize a string into an HTML id
		uid: function(id) {
			if (!id) throw "meta4:ux:oops:missing-id";
			return id.replace(new RegExp("[^A-Za-z0-9]", 'g'),"_");
		},

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

		initialize: function(view, options) {
			if (!view) throw "meta4:ux:oops:missing-view";
			if (!view.render) throw "meta4:ux:oops:not-a-view";
			if (!options) throw "meta4:ux:oops:missing-options";
			var _DEBUG = options.debug || ux.DEBUG
			core.ux.model(options, view)

			this.events = _.extend({}, this.events, this.options?this.options.events:{}, options.events)
			this.ui = _.extend({}, this.ui, options.ui)

			core.ux.mixer.call(view, options)
			core.iq.aware(view, options.when || options.iq)
		    core.ux.stylize(view, options);

//	        Backbone.View.prototype.delegateEvents.apply(this, options);

//			if (view.triggerMethod) view.triggerMethod("initialize", options)
//			else view.trigger("initialize", options)
////_DEBUG && console.log("UX init (%s): %o %o", options.id, view, options)
			return view;
		},

		// bind models (and optional collections) by reference (string),
		// Backbone.Model or from default options
		model: function(options, modelled) {
			return core.resolve(options, modelled)
		},

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
//console.log("Stylize: %s -> %o", className, arguments[0])
		    }
//		    self.className = className + css
			return css;
		},

		checkAttributes: function( options, required ) {
			return core.ux.checkOptions( options, required )
		},

		// enforce required options, throw an exception if undefined
		checkOptions: function(options, required) {
			if (!options) throw "meta4:ux:oops:missing-options";
			required = required || [ ux.idAttribute, ux.labelAttribute];
//DEBUG && console.log("checkOptions()", options, required)
			for (var i = 0; i < required.length; i++) {
				var key = required[i];
				if (_.isUndefined(options[key])) {
//					console.error("Missing '%s' options: %s -> %o", key, options[idAttribute], options);
					throw new TypeError("meta4:ux:oops:missing-option-"+key);
				}
			}
			return options;
		}
	});

	/* *****************************************************************************************************************
		UX factories
	**************************************************************************************************************** */

	core.ux.Widget = function(options) {
		if (!options) throw "meta4:ux:widget:oops:missing-options";
		// functional options
		if (!_.isObject(options)) throw "meta4:ux:widget:oops:invalid-options";

        // cloned options makes them naively immutable
		options = _.extend({}, { widget: "Template" }, options)
		var _DEBUG = options.debug || ux.DEBUG
_DEBUG && console.log("UX Widget: ", options)


		// obtain a Backbone.View from global UX namespace
		var widgetType = options.widget || options.type
		var fnView = core.ux.view[widgetType];
		if (!fnView) throw "meta4:ux:oops:unknown-widget#"+widgetType;

		// get Widget Class
		var Widget = fnView(options);
		if (!Widget || !_.isFunction(Widget)) throw "meta4:ux:oops:invalid-widget#"+widgetType;

		// Marionette needs to extend Widget rather than configure
		Widget = Widget.extend( _.pick(options, "events", "ui") )

        // Extend
        if (options.extends) {
            var _extend = core.ux.view[options.extends]
            options = _.extends({}, _extend, options)
            console.log("EXTEND: %s %o", options.extends, _extend)
        }

		// resolve Model/Collections
		options = core.ux.model(options);
		options[ux.idAttribute] = core.ux.uid(options[ux.idAttribute]);

		// instantiate View
		var widget = new Widget(options);

_DEBUG && console.debug("UX Widget (%s @ %s): %o -> (css: %s) %o", options[ux.idAttribute], widgetType, options, widget.className +" - "+options.className, widget);

        // deprecate - should be isModal - and a mix-in
		if (options.modal)  ux.modal(widget)

		// refresh remote collections
		if (widget.collection && options.fetch) {

			widget.on("before:render", function() {
				var fields = _.pick(widget.model.attributes, widget.collection.options.parameters || ["id"] )
_DEBUG && console.debug("Fetch Widget (%s @ %s): %o", options[ux.idAttribute], widgetType, fields);
				widget.collection.fetch( { debug: options.debug?true:false, filter: fields } )
			})
		}

		if (options.help) {
			widget.on("show", function() {
				var self = this
				var helpOptions = _.extend({ id: options[ux.idAttribute], type: "Help", template: options[ux.idAttribute]+".html" }, options.help)
				var HelpView = core.ux.view[helpOptions.type](helpOptions);
				var helpView = new HelpView(helpOptions);
				helpView.render()
				widget.$el.parent().prepend(helpView.$el)
_DEBUG && console.debug("Help View: (%s) %o %o", options[ux.idAttribute], helpOptions, helpView);
			})
		}

		core.ux.tour(options)
		return widget;
	}

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

	core.ux.muffle = function(e) {
		e.stopImmediatePropagation()
		e.preventDefault()
	}

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
