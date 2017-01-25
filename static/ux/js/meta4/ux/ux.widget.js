define(["jquery", "underscore", "marionette", "Handlebars", "core"], function ($,_, Marionette, Handlebars, core) {

    return function(options, navigator) {
        if (!options) throw new Error("meta4:ux:widget:oops:missing-options");
        if (!navigator) throw new Error("meta4:ux:NavBar:oops:missing-navigator");
        if (!navigator.widgets) throw new Error("meta4:ux:NavBar:oops:invalid-navigator");

        // functional options
        if (!_.isObject(options)) throw new Error("meta4:ux:widget:oops:invalid-options");

        // cloned options makes them naively immutable
        options = _.extend({}, { widget: "Template" }, options);
        var _DEBUG = options.debug?true:false

        // obtain a Widget (aka Backbone.View) from global UX namespace
        var widgetType = options.widget || options.type;
        var widgetClass = navigator.widgets.widget(widgetType);

        // sanitize the 'ID' to keep the DOM happy
        var id = options[core.ux.idAttribute] = core.ux.uid(options[core.ux.idAttribute]);

        if (!widgetClass) throw new Error("meta4:ux:oops:unknown-widget#"+widgetType);

        // get Widget instance
        var ViewClass = widgetClass(options, navigator);
        _DEBUG && console.log("ux.Widget: %s (%s) %o %o", options.id, widgetType, options, ViewClass)

        if (!ViewClass || !_.isFunction(ViewClass)) {
            throw new Error("meta4:ux:oops:invalid-widget#"+widgetType);
        }

        // Marionette needs us to extend Widget to configure events & ui
        ViewClass = ViewClass.extend( _.pick(options, "events", "ui") );

        // Inherit from other widget
        if (options.extends) {
            var _extend = module.views.get(options.extends);
            options = _.extends({}, _extend, options);
            console.log("EXTEND: %s %o", options.extends, _extend);
        }

        // resolve Model/Collections
        options = core.ux.model(options);

        // instantiate View
        var view = new ViewClass(options, navigator);

        // decorate view (with mixins, styles, models, etc);
//        core.ux.initialize(view, options, navigator);

        _DEBUG && console.warn("Widget View: %s: %o ", id, view);

        // TODO: deprecate? - should it be isModal mix-in?
        if (options.modal || options.isModal)  {
            navigator.trigger("modal", view);
            navigator.Modal(view);
        }

        // handle data

        var collection_options = view.collection?view.collection.options:{};
        console.log("new view %o %o collection: %o -> %o", view.id, view, view.collection||"No Data", collection_options);

        // refresh remote collections
        var collections_id = view.collection?view.collection.id:false;
        var fetch = (options.fetch==false?false:true) || (collections_id && view.collection.options.fetch==false?false:true);
        var prefetch = (options.prefetch?true:false)  || (collections_id && view.collection.options.prefetch?true:false);

        if (collections_id && fetch) {
            _DEBUG && console.log("fetch? %s -> %s / v: (%s) %s -> %s / m: (%s) %s -> %s",
                fetch, prefetch,
                id, options.fetch==false?false:true, options.prefetch?true:false,
                collections_id, view.collection.options.fetch==false?false:true, view.collection.options.prefetch?true:false );

            view.on("before:render", function() {
                if (view._isFetched) return;
                var fields = _.pick(view.model.attributes, view.collection.options.parameters || ["id"] );
                console.debug("fetching (%s @ %s): %o", id, widgetType, fields);
                view._isFetched = true;
                view.collection.fetch( { debug: options.debug?true:false, filter: fields } );
            })

            // view.collection.on("request", function() {
            //     view.$el.append("[loading]");
            // })
        }

        // show inline help ... TODO: reconsider this strategy
        if (options.help) {

            view.on("show", function() {
                var self = this
                var helpOptions = _.extend({ id: id, type: "Help", template: options[core.ux.idAttribute]+".html" }, options.help)
                var HelpView = core.ux.view[helpOptions.type](helpOptions);
                var helpView = new HelpView(helpOptions);
                helpView.render();
                view.$el.prepend(helpView.$el)
                _DEBUG && console.debug("Help View: (%s) %o %o", id, helpOptions, helpView);
            })

        }

        // inject a 'guided tour' feature ... TODO: fix it
        if (options.tour) core.ux.tour(options)

        return view;
    }
});