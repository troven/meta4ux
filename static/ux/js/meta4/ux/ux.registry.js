define(["jquery", "underscore", "marionette", "Handlebars", "core"], function ($,_, Marionette, Handlebars, core) {

    // ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
    core.ux.ViewRegistry = Backbone.Model.extend({

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

    core.ux.WidgetRegistry = Backbone.Collection.extend({
        idAttribute: core.ux.idAttribute,

        /**
         * Catch duplicates
         * @method
         * @param {string} id - the unique identity of the Widget.
         * @param {string} options - the definition of the Widget.
         */
        register: function(options) {

            if (!_.isString(options.id))
                throw new Error("meta4:ux:oops:widget:register:missing-id");

            if (this.get(id))
                throw new Error("meta4:ux:oops:widget:register:duplicate-widget#"+id);

            return this.set(id, options);
        },

        requires: function(options, cb) {
            var widgetTypes = [];
            var viewURL = "" //options.url;
            var self = this;
            var DEBUG = options.debug || true;

            // Register View configurations
            var registerNestedViews = function(options, views) {
                if (!views) return

                _.each(views, function(view, id) {
                    if (!_.isEmpty(view)) {
                        if (view.id) {
                            core.ux.views.register( view.id, view );
                        }
                        // try our best to resolve something
                        var widgetType = view[core.ux.typeAttribute] || view.widget || view.type || "Template";
                        var path = view.require?view.require:viewURL+"js/meta4/widget/"+widgetType+".js";
                        // add require.js paths
                        if (path && widgetTypes.indexOf(path)<0) widgetTypes.push(path);
                        // views and tabs
                        registerNestedViews(view, view.views);
                        registerNestedViews(view, view.tabs);
                    }
                })
            }

            // recursively register all views
            registerNestedViews(options, options.views);

DEBUG && console.log("Loading %s widgets: %o", options.id, widgetTypes)

            // uses require.js to load Widgets and cache meta-data,
            require(widgetTypes, function() {
                _.each(arguments, function(widget, i) {

                    if (!widget.id)
                        throw new Error(widgetTypes[i]+ " is missing {{id}}");

                    if (!_.isFunction(widget.fn))
                        throw new Error(widget.id+ " not a valid Widget fn()");

                    self.add(widget);
                })
                console.log("Loaded %s x %s widgets (total: %s)", widgetTypes.length, options.id, core.ux.widgets.size());
                cb && cb();
            })

        },

        // retrieve a function that will instantiate a View
        widget: function(id) {
            if (_.isObject(id)) {
                id = id[core.ux.typeAttribute];
            }

            if (!_.isString(id))
                throw new Error("meta4:ux:widget:oops:invalid-id");

            var _widget = this.get(id);
            if (!_widget)
                throw new Error("meta4:ux:widget:oops:missing#"+id);

            var fn = _widget.get("fn")

            if (!_.isFunction(fn))
                throw new Error("meta4:ux:widget:oops:missing-fn#"+id);

            return fn
        }
    })


    return core.ux;
});