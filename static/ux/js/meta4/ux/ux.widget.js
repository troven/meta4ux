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

        var id = options[core.ux.idAttribute];
//        _DEBUG && console.log("Widget: %s -> %s -> %o", id, widgetType, options);

        if (!id) {
            console.error("Anonymous Widget: %o", options);
            throw new Error("meta4:ux:oops:widget:missing-id#"+widgetType, options);
        }

        // sanitize the 'ID' to keep the DOM happy
        id = core.ux.uid(options[core.ux.idAttribute]);
        if (!widgetClass) throw new Error("meta4:ux:oops:unknown-widget#"+widgetType);

        // get Widget instance
        var ViewClass = widgetClass(options, navigator);
        _DEBUG && console.log("new view: %s (%s) %o", id, widgetType, options);

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

        // resolve Model/Collections - dupe: handled by ux.initialize
//        options = core.ux.model(options);

        // instantiate View
        var view = new ViewClass(options, navigator);

        // decorate view (with mixins, styles, models, etc);
//        core.ux.initialize(view, options, navigator);

//        _DEBUG && console.warn("Widget View: %s: %o ", id, view);

        // handle data

        var collection_options = view.collection?view.collection.options:{};
        _DEBUG && console.log("New View %o %o\ncollection: %o -> %o", id, view, view.collection||"No Data", collection_options);

        // refresh remote collections
        var collections_id = view.collection?view.collection.id:false;
        var fetch = (options.fetch===false?false:true) || (collections_id && collection_options.fetch===false?false:true);
        var prefetch = (options.prefetch?true:false)  || (collections_id && collection_options.prefetch?true:false);

        if (collections_id && fetch) {
            _DEBUG && console.log("fetch? %s -> %s / v: (%s) %s -> %s / m: (%s) %s -> %s",
                fetch, prefetch,
                id, options.fetch===false?false:true, options.prefetch?true:false,
                collections_id, collection_options.fetch===false?false:true, collection_options.prefetch?true:false );

            view.on("before:render", function() {
                if (view.collection.synced) return;
                var idAttribute = collection_options.idAttribute;
                var fields = _.pick(view.model.attributes, collection_options.parameters || [idAttribute] );
                console.debug("fetching (%s @ %o): %o", id, fields, view.collection);
                view.collection.fetch( { debug: options.debug?true:false, filter: fields } );
            })

            // view.collection.on("request", function() {
            //     view.$el.append("[loading]");
            // })
        }

        // show inline help ... TODO: reconsider this strategy
        if (options.help) {
            var help_id = _.isString(options.help)?options.help:id;

            view.on("render", function() {
                var self = this

                var helpOptions = _.extend(
                    { id: help_id+"#help", type: "Help", template: "template:"+help_id+".html" },
                    _.isObject(options.help)?options.help:{} );

                var HelpView = core.ux.view[helpOptions.type](helpOptions);
                var helpView = new HelpView(helpOptions);
                helpView.render();
                view.$el.prepend(helpView.$el);
                // _DEBUG &&
                console.debug("Help View: (%s @ %s) %o %o", help_id, id, helpOptions, helpView);
            })

        }

        // inject a 'guided tour' feature ... TODO: fix it
        if (options.tour) core.ux.tour(options)

        view.isModal = options.modal?true:false;

        return view;
    }
});