define(["jquery", "underscore", "marionette", "Handlebars", "core"], function ($,_, Marionette, Handlebars, core) {

    core.ux.Widget = function(options) {
        if (!options) throw new Error("meta4:ux:widget:oops:missing-options");
        // functional options
        if (!_.isObject(options)) throw new Error("meta4:ux:widget:oops:invalid-options");

        // cloned options makes them naively immutable
        options = _.extend({}, { widget: "Template" }, options);
        var _DEBUG = options.debug || core.ux.DEBUG;

        // obtain a Widget (aka Backbone.View) from global UX namespace
        var widgetType = options.widget || options.type;
        var widgetClass = core.ux.widgets.widget(widgetType);

        // sanitize the 'ID' to keep the DOM happy
        var id = options[core.ux.idAttribute] = core.ux.uid(options[core.ux.idAttribute]);

        if (!widgetClass) throw new Error("meta4:ux:oops:unknown-widget#"+widgetType);

        // get Widget instance
        var ViewClass = widgetClass(options);
        _DEBUG && console.warn("ux.Widget: %s (%s) %o %o", options.id, widgetType, options, ViewClass)

        if (!ViewClass || !_.isFunction(ViewClass)) {
            throw new Error("meta4:ux:oops:invalid-widget#"+widgetType);
        }

        // Marionette needs us to extend Widget to configure events & ui
        ViewClass = ViewClass.extend( _.pick(options, "events", "ui") );

        // Inherit from other widget
        if (options.extends) {
            var _extend = core.ux.view[options.extends];
            options = _.extends({}, _extend, options);
            console.log("EXTEND: %s %o", options.extends, _extend);
        }

        // resolve Model/Collections
        options = core.ux.model(options);


        // instantiate View
        var view = new ViewClass(options);

        _DEBUG && console.debug("Widget View (%s @ %s): %o / %o", id, widgetType, options, view);

        // deprecate - should be isModal mix-in
        if (options.modal || options.isModal)  {
            core.ux.Modal(view)
        }

        var collection_options = view.collection?view.collection.options:{};
        console.log("view %s %o collection: %o -> %o", view.id, view, view.collection, collection_options);

        // refresh remote collections
        var collections_id = view.collection?view.collection.id:false;
        var fetch = (options.fetch==false?false:true) || (collections_id && view.collection.options.fetch==false?false:true);
        var prefetch = (options.prefetch?true:false)  || (collections_id && view.collection.options.prefetch?true:false);

        if (collections_id && fetch) {
            console.log("fetch? %s -> %s / v: (%s) %s -> %s / m: (%s) %s -> %s",
                fetch, prefetch,
                id, options.fetch==false?false:true, options.prefetch?true:false,
                collections_id, view.collection.options.fetch==false?false:true, view.collection.options.prefetch?true:false );

            view.on("before:render", function() {
                var fields = _.pick(view.model.attributes, view.collection.options.parameters || ["id"] )
                _DEBUG && console.debug("fetch (%s @ %s): %o", id, widgetType, fields);
                view.collection.fetch( { debug: options.debug?true:false, filter: fields } )
            })

        }

        // show inline help ... TODO: reconsider this strategy
        if (options.help) {

            view.on("show", function() {
                var self = this
                var helpOptions = _.extend({ id: id, type: "Help", template: options[core.ux.idAttribute]+".html" }, options.help)
                var HelpView = core.ux.view[helpOptions.type](helpOptions);
                var helpView = new HelpView(helpOptions);
                helpView.render()
                view.$el.parent().prepend(helpView.$el)
                _DEBUG && console.debug("Help View: (%s) %o %o", id, helpOptions, helpView);
            })

        }

        // inject a 'guided tour' feature ... TODO: fix it
        if (options.tour) core.ux.tour(options)

        return view;
    }

    return core.ux;
});