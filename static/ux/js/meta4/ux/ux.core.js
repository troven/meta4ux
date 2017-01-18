define(["jquery", "underscore", "marionette", "Handlebars", "core",
    "meta4/ux/ux.mixin", "meta4/ux/templateHelpers", "meta4/ux/ux.util", "meta4/ux/ux.widget", "meta4/ux/ux.registry", "oops", "md5"
], function ($,_, Marionette, Handlebars, core, ux, TemplateHelpers, ux_util, ux_widget, ux_registry, Oops, md5) {

/*
    Define the UX Mediator object
*/

    _.extend(ux, {
        view: {},

        boot:function(module, options) {
            if (!module) throw new Error("meta4:ux:boot:oops:missing-module");

            var self = this;

            core.oops = new Oops(options.errors);

            module.views = new core.ux.ViewRegistry();
            module.widgets = new core.ux.WidgetRegistry();
            module.templates = {};

            // compile HTML templates
            _.each(options.templates, function(template, id) {
                module.templates[id] = self.compileTemplate(template);
            });

            // register Template helpers
            _.each(core.ux.templateHelpers, function(fn,name) {
                Handlebars.registerHelper(name,fn);
            });

            console.log("UX: boot: %o", options.views);

            // discover used widgets
            var widgetTypes = module.views.register(options.views);

            // lazy-load the widgets
            module.widgets.requires(widgetTypes, function() {
                module.trigger("home", options);
            });

            return self;
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
            if (!$el.find || !$el.attr) throw "meta4:ux:oops:invalid-dom";
            // hunt for an ID (usually a model)
            var $id = false, id = false
            $id = $el.find("[data-id]")
            id = $id.attr("data-id")
            if (id) return id;

            $id = $el.find("[id]")
            id = $id.attr("id")
            if (id) return id;

            throw new Error("meta4:ux:oops:missing-dom-id");
        },

        // can be called by a Widget to intialize itself
        // injects Mixins, resolve models / collections
        // binds events to global functions
        // augment CSS classes
        //

        initialize: function(view, options, navigator) {
            if (!view) throw new ux.oops.Error("meta4:ux:oops:missing-view");
            if (!view.render) throw new ux.oops.Error("meta4:ux:oops:not-a-view");
            if (!options) throw new Error("meta4:ux:oops:missing-options");
            var _DEBUG = options.debug || ux.DEBUG;

            if (view.navigator) throw ux.oops.Error("meta4:ux:oops:re-initialized#"+view.id);

            view.navigator = navigator?navigator:false;
            core.ux.model(options, view);

            this.events = _.extend({}, this.events, this.options?this.options.events:{}, options.events);
            this.ui = _.extend( {}, this.ui, options.ui );

            // apply mixins
            core.ux.mixer.call(view, options);

            // bind "when:" events
            core.iq.aware(view, options.when);

            // apply css - incl className hueristics
            core.ux.stylize(view, options);

            // nested views
            if (options._views) this._views = options._views;

            // announce
            view.trigger("initialized");
            navigator && navigator.trigger("view", view);

            return view;
        },

        // bind models (and collections) by reference (string), function an existing Backbone.Model or JSON options
        model: function(options, modelled) {
            return core.resolve(options, modelled);
        },

        // resolve look-up values using a variety of strategies - returns Collection of { id, label }
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
            var css = "";
            var className = "";
            _.each(arguments, function(v) {
                css = css + (v.css?" "+v.css:""); // concat all CSS modification
                className = v.className?v.className:className; // last matching takes precedence
            })
            var self = arguments[0];
            className = className + css;
            if (self.$el && className) {
                self.$el.addClass(className);
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
