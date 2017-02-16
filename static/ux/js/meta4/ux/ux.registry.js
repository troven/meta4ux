define(["underscore", "marionette", "Handlebars", "core", "meta4/ux/ux.widget"], function (_, Marionette, Handlebars, core, Widget) {

    var DEFAULT_WIDGET_TYPES = [ "meta4/widget/Home", "meta4/widget/Buttons", "meta4/widget/CRUD" ];

    // ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
    core.ux.ViewRegistry = Backbone.Model.extend({
        debug: false,
        navigator: false,

        /**
         * Cache the View definitions in a Backbone Model.
         * @method
         * @param {string} id - the unique identity of the View.
         * @param {string} options - the definition of the View.
         */
        register: function(id, options) {
            if (_.isArray(id) || _.isObject(id)) {
                return this._registerViews(id);
            }
            if (this.get(id)) throw new Error("meta4:ux:register:oops:duplicate-view#"+id);
            return this.set(id,options);
        },

        _registerViews: function(views) {
            if (!views) return [];

            var widgetTypes = this._registerViewsAndWidgets(views);
            this._resolveNestedViews();
            return widgetTypes;
        },

        /**
         * Instantiate a named View.
         * @method
         * @param {string} id - the unique identity of the View.
         * @param {string} options - the definition of the View.
         */
        view: function(id, _options, navigator) {
            var widget = false;
            // resolve the arguments
            if (!id) throw new Error("meta4:ux:oops:missing-view-id");
            if (!navigator) throw new Error("meta4:ux:oops:missing-navigator");

            // objects are cloned, then instantiated directly
            if (_.isObject(id)) {
                if (!id.id) throw new Error("meta4:ux:oops:missing-id");
                _options = _.extend({}, id, _options);
                id = id.id;
                widget = new Widget(_options, navigator);
            } else if (_.isFunction(id)) {
                // functions
                widget = id(_options, navigator);
            } else if (_.isString(id)) {
                _options = _.extend({}, this.get(id), _options);
                widget = new Widget(_options, navigator);
//                console.log("view reference: %s %o ->%o", id, _options, widget);
            }
            if (!widget) throw new Error("meta4:ux:oops:invalid-view#"+id);

            // support local or global navigator
            widget.navigator = widget.navigator || navigator || this.navigator || false;

            if (widget.navigator) {
                // navigator listens to all events
                self.debug && console.log("Module View: %s -> %o", id, widget.navigator);
                    widget.on("all", function() {
//                    console.log("Widget All: %s -> %o", id, arguments);

                    // route widget events to navigator/controller
                    widget.navigator.trigger.apply(widget.navigator, arguments);

                    // globalize the event namespace
                    arguments[0] = id+":"+arguments[0];
                    widget.navigator.trigger.apply(widget.navigator, arguments);
                });
            }

            return widget
        },

        _resolveNestedViews:function() {
            var self = this;

            _.each(this.attributes, function(view, id) {
                self.__resolveNestedViews(view);
            })
        },

            // nested views[]{} hierarchy and return a k/v of widgets
        __resolveNestedViews:function(parent) {
            var self = this;
            parent._views = {};
//            console.log("__resolveNestedViews: %o -> %o", parent.id, parent);

            var _resolveView = function(view, key) {

                if (_.isString(view)) {
                    var _view = self.get(view);
                    if (!_view) {
                        throw new Error("meta4:ux:oops:missing-view#"+view+"@"+parent.id+"#"+key);
                    }
//                    console.log("resolve view: %s -> %o -> %o", key, view, _view);
                    view = parent._views[key] = _view;
                } else if (_.isObject(view)) {
                    view.id = view.id || parent.id+"#"+key;
                    parent._views[key] = view;
                    self.register(view.id, view);

                    self.__resolveNestedViews(view);

                } else throw new Error("meta4:ux:oops:invalid-nested-view#"+parent.id+"#"+key);

                return view;
            }

            // build internal view cache for nested tabs/sub-views
            _.each(parent.views, _resolveView);
            _.each(parent.tabs, _resolveView);

            return parent;
        },

        _registerViewsAndWidgets: function(views, widgetTypes, parent) {
            var self = this;
            widgetTypes = widgetTypes || DEFAULT_WIDGET_TYPES;

            _.each(views, function(view, key) {
                if (_.isObject(view)) {

                    var id = view.id || parent.id+"#"+key;
                    if (id) {
                        // register global views
                        self.register( view.id, view );
                    }
//                    console.warn("register view: %s -> %o", id, view);

                    // try our best to resolve something
                    var widgetType = view[core.ux.typeAttribute] || "Template";
                    var path = view.require?view.require:"meta4/widget/"+widgetType;

                    // widget paths are unique
                    if (path && widgetTypes.indexOf(path)<0) {
                        widgetTypes.push(path);
                    }

                    // nested views and tabs
                    self._registerViewsAndWidgets(view.views, widgetTypes, view);
                    self._registerViewsAndWidgets(view.tabs, widgetTypes, view);
                } else {
//                    console.error("invalid view: %o", view);
                }
            });

            return widgetTypes;
        }
    })

    // ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
    /**
     * Cache widget meta-data. Resolve embedded widget() function.
     * @constructor
     */

    core.ux.WidgetRegistry = Backbone.Collection.extend({
        idAttribute: core.ux.idAttribute,
        debug: false,

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

        requires: function(widgetTypes, cb) {
            var self = this;
            self.debug && console.log("Requires widgets: %o", widgetTypes);

            // uses require.js to load Widgets and cache meta-data,
            require(widgetTypes, function() {
                _.each(arguments, function(widget, i) {

                    if (!widget.id)
                        throw new Error(widgetTypes[i]+ " is missing {{id}}");

                    if (!_.isFunction(widget.fn))
                        throw new Error(widget.id+ " not a valid Widget fn()");

                    self.add(widget);
                })

               console.log("Loaded widgets: %o ->> %o", widgetTypes, arguments);
                self.debug && console.log("Loaded %s x widgets (total: %s)", widgetTypes.length, self.size());
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
            if (!_widget) {
                console.log("Missing Widget: %o", this, core.ux.view);
                throw new Error("meta4:ux:widget:oops:missing#"+id);
            }

            var fn = _widget.get("fn")

            if (!_.isFunction(fn))
                throw new Error("meta4:ux:widget:oops:missing-fn#"+id);

            return fn
        }
    })


    return core.ux;
});