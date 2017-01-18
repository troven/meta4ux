define(["underscore", "backbone", "marionette", "core", "oops", "meta4/iq/helps"], function (_, Backbone, M, core, oops, helps) {

    return function(options, controller) {
        if (!options) throw new Error("Missing options for Module");

        console.log("CTRLR: %o -> %o", options, controller);

       return {

            boot: function (_options) {
                _options || (_options = {});
                console.log("CTRLR: boot: %s -> %o %o", name, app, _options);

                // define an initial "home" view
                this._view = new Layout( {el: _options.el || options.el || this.el || "body" });

                var routes = helps.RouteBuilder(controller);
                this.router = helps.Router( { controller: controller, routes: routes });

                this.on("start", function() {
                    console.log("CTRLR: start: %o %o", this, options);
                    this._view.render();
                });

                this.on("stop", function() {
                    console.log("CTRLR: stop: %o %o", this, options);
                    this._view.destroy();
                });

                Backbone.history.start();

                var currentView = Backbone.history.fragment || false;
                currentView && this.navigate( currentView );
            },

            home: function(_view) {
                if (_.isObject(_view)) {
                    this._view = module.meta4.ux.Home(_view, this);
                }

                console.log("CTRLR: home: %o", this);

                this._view.triggerMethod("show");
                return this._view;
            },

            show: function(view) {
                this._view.show(view);
            },

            navigate: function (route, options) {
                console.log("CTRLR: navigate: %o %o", route, options);
                options || (options = {});
                Backbone.history.navigate(route, options);
            }

        };
    }

});