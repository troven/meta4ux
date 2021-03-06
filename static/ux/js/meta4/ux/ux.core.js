define(["jquery", "underscore", "backbone.radio", "marionette", "Handlebars", "core",
    "meta4/ux/ux.mixin", "meta4/ux/templateHelpers", "meta4/ux/ux.util", "meta4/ux/ux.widget", "meta4/ux/ux.registry", "oops", "md5"
], function ($,_, BB_radio, Marionette, Handlebars, core, ux, TemplateHelpers, ux_util, ux_widget, ux_registry, Oops, md5) {

/*
    Define the UX Mediator object
*/

    _.extend(ux, {
        view: {},

        boot:function(module, options) {
            if (!module) throw new Error("meta4:ux:boot:oops:missing-module");

            var oops = module.oops = new Oops(options.errors||{});

            var self = this;
            var _DEBUG = options.debug || false;
            _DEBUG && console.log("boot: %o", options);

            core.oops = new Oops(options.errors);

            module.views = new core.ux.ViewRegistry();
            module.widgets = new core.ux.WidgetRegistry();
            module.templates = {};

            // register globally
            core.fact.models.set("meta4views", module.views);

            // compile HTML templates
            _.each(options.templates, function(template, id) {
                module.templates[id] = self.compileTemplate(template);
            });

            // register Template helpers
            _.each(core.ux.templateHelpers(module,options), function(fn,name) {
                Handlebars.registerHelper(name,fn);
            });

            _DEBUG && console.log("loaded views: %o", options.views);

            // discover used widgets
            var widgetTypes = module.views.register(options.views);
            _DEBUG && console.log("widgetTypes: %o", widgetTypes);

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
            console.error("missing-drag-dom: %o -> %o", this, $el);
        },

        // can be called by a Widget to intialize itself
        // injects Mixins, resolve models / collections
        // binds events to global functions
        // augment CSS classes
        //

        initialize: function(view, options, navigator) {
            if (!view) throw new Error("meta4:ux:oops:missing-view");
//            if (!navigator) throw new Error("meta4:ux:oops:missing-navigator#"+view.id);
            if (!view.render) throw new navigator.oops.Error("meta4:ux:oops:not-a-view");
            if (!options) throw new navigator.oops.Error("meta4:ux:oops:missing-options");
            var _DEBUG = options.debug || ux.DEBUG;

            if (view.navigator) throw navigator.oops.Error("meta4:ux:oops:re-initialized#"+view.id);

            view.navigator = navigator?navigator:false;

            // initialize model/collection
            core.ux.model(options, view);

            // defaults
            view.events = _.extend({}, view.events, view.options?view.options.events:{}, options.events);
            view.ui = _.extend({}, view.ui, options.ui );
            view.can = _.extend({}, view.can, options.can);

            // apply mixins
            core.ux.mixer.call(view, options);

            // apply css - incl className hueristics
            core.ux.stylize(view, options);

            // nested views
            view._views = _.extend({}, options._views);

            // bind "when:" events
            core.iq.aware(view, options.when);
//            console.log("VIEW WHEN: %o %o -> %o", options.id, options, options.when);

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
            var _DEBUG = true; //ux.DEBUG
            if (_.isArray(values)) {
                values = _.map(values, function(v) { return _.isObject(v)?v:{ id: v, label: v} });
                _DEBUG && console.log("Array Lookup: %o", values)
                return new Backbone.Collection(values);
            } else if (_.isObject(values)){
                values = _.map(values, function(v,k) { return _.isObject(v)?v:{ id: k, label: v} });
                _DEBUG && console.log("Object Lookup: %o", values)
                return new Backbone.Collection(values);
            } else if (_.isString(values)) {
                _DEBUG && console.log("Named Lookup: %o -> %o", values, core.fact);
                return core.fact.models.get(values);
            } else  {
                throw new Error("meta4:ux:oops:invalid-values");
            }
        },

        // augment view with absolute 'className' or cumulative 'css' styles
        stylize: function(view, options) {
            var css = "";
            var className = "";
            _.each(arguments, function(v) {
                css = css + (v.css?" "+v.css:""); // concat all CSS modification
                className = v.className?v.className:className; // last matching takes precedence
            })
            className = className + " "+css;
            if (view.$el && className) {
                view.$el.addClass(className);
            }
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
