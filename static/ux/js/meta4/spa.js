define(["underscore", "backbone", "marionette", "core", "ux", "fact", "iq", "oops", "meta4/ux/modals"], function (_, BB, M, meta4, ux, fact, iq, oops, Modals) {

    // lazy boot loader
    return function() {

        var SPA = new M.Application();

        SPA.on("start", function (options) {

            var navigator = _.extend({}, Modals, BB.Events);

            console.log("SPA: started: %o -> ", options, navigator);

            // Boot the Module's dynamic architecture
            iq.boot(navigator, options);
            fact.boot(navigator, options);
            ux.boot(navigator, options);

            // define the user principal
            var ProfileModel = Backbone.Model.extend({url: "/models/me"});
            navigator.user = new ProfileModel(options.principal || {label: "Anonymous"});

            // handle events
            // navigator.on("all", function(event, scope) {
            //     console.log("on: %o -> %o", event, scope);
            // });

            navigator.on("navigate", function (go_to) {
                console.log("**** NAVIGATE: %s ****", go_to);
            });

            // home view
            navigator.on("home", function () {
                var home = navigator.Home(options.home, navigator);
                home.triggerMethod("show");
                navigator.home = home;
                SPA.trigger("navigator", navigator);
                SPA.trigger("home", home);
            });

            // existing fragment
            var currentView = Backbone.history.fragment || false;
            currentView && this.trigger("navigate", currentView);

            // set-up routing
            Backbone.history.start();
        });

        return SPA;
    }

});