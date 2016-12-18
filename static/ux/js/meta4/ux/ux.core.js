define(["jquery", "underscore", "marionette", "Handlebars", "core",
    "meta4/ux/ux.dialog", "meta4/ux/ux.mixin", "meta4/ux/ux.util", "meta4/ux/ux.ctrl", "meta4/ux/ux.registry", "md5"

], function ($,_, Marionette, Handlebars, core, ux, ux_mixin, ux_util, ux_ctrl, ux_registry, md5) {


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
        hash: function(that) {
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
        views: new core.ux.ViewRegistry(),
        widgets: new core.ux.WidgetRegistry(),
        templates: {},
        view: {},

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
            core.ux.widgets.requires(options, function() {
                module.trigger("ux:boot", self, options)
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

        // can be called by a Widget to intialize itself
        // injects Mixins, resolve models / collections
        // binds events to global functions
        // augment CSS classes
        //

        initialize: function(view, options) {
            if (!view) throw new Error("meta4:ux:oops:missing-view");
            if (!view.render) throw new Error("meta4:ux:oops:not-a-view");
            if (!options) throw new Error("meta4:ux:oops:missing-options");
            var _DEBUG = options.debug || ux.DEBUG;
            core.ux.model(options, view);

            this.events = _.extend({}, this.events, this.options?this.options.events:{}, options.events);
            this.ui = _.extend({}, this.ui, options.ui);

            core.ux.mixer.call(view, options);
            core.iq.aware(view, options.when || options.iq);
            core.ux.stylize(view, options);

//	        Backbone.View.prototype.delegateEvents.apply(this, options);

            return view;
        },

        // bind models (and collections) by reference (string), function an existing Backbone.Model or JSON options
        model: function(options, modelled) {
            return core.resolve(options, modelled);
        },

        // resolve look-up values using a variety of strategies - always returning an array of the form [{ id, label }]
        lookup: function(values) {
            if (_.isArray(values)) {
                values = _.map(values, function(v) { return _.isObject(v)?v:{ id: v, label: v} });
                ux.DEBUG && console.log("Array Lookup: %o", values)
                return new Backbone.Collection(values);
            } else if (_.isObject(values)){
                values = _.map(values, function(v,k) { return _.isString(v)?{ id: k, label: v}:v });
                ux.DEBUG && console.log("Object Lookup: %o", values)
                return new Backbone.Collection(values);
            } else if (_.isString(values)) {
//DEBUG &&
                console.log("Named Lookup: %o -> %o", values, core.fact);
                return core.fact.models.get(values);
            } else  {
                return new Backbone.Collection(values);
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


    return core.ux
});
