define(["underscore", "backbone", "marionette", "core", "ux", "fact", "iq", "oops", "meta4/util/helpers", "meta4/ux/modals"], function (_, BB, M, meta4, ux, fact, iq, oops, helpers, Modals) {

    var ShowHome = function (options, navigator) {
        return function() {
            if (navigator.home) {
//                console.log("RE-HOME: %o -> %o", navigator.home, arguments);
                navigator.home.show();
                return;
            }
//            console.log("NEW-HOME: %o -> %o", (navigator.home?navigator.home:"1st home"), navigator);

            console.log("HOME: %o", options);
            navigator.home = navigator.Home(options.home, navigator);
            navigator.home.triggerMethod("show");

            Backbone.history.start();
        }
    }


    var Routing = function(navigator, options) {

        var routing = Backbone.Router.extend({

            routes: {
                "views:view":           "view",
                // "auth/:code":           "auth",
                // "search/:query":        "search",
                "logout":               "logout"
            },

            view: function(view) {
                console.log("direct view: views%s", view);
                navigator.trigger("navigate", "views"+view);
            },

            logout: function() {
                console.log("LOGOUT: %o", arguments);
                navigator.trigger("logout");
            }

        });

        return new routing();
    };

    // lazy boot loader
    return function() {

        var SPA = new M.Application();

        SPA.on("start", function (app, options) {

            var _DEBUG = options.debug;
            var navigator = _.extend({}, Modals, BB.Events);

            _DEBUG && console.log("SPA: started: %o -> ", options, navigator);

            // Boot the Module's dynamic architecture
            iq.boot(navigator, options);
            fact.boot(navigator, options);
            ux.boot(navigator, options);

            // define the user principal
            var ProfileModel = Backbone.Model.extend({url: "/models/me"});
            navigator.user = new ProfileModel(options.principal || {label: "Anonymous"});
            navigator.state = new Backbone.Model();

            // handle events
            // navigator.on("all", function(event, scope) {
            //     console.log("on: %o -> %o", event, scope);
            // });

            navigator.on("navigate", function (go_to) {
console.log("navigator goto: %s", go_to);
                if (!navigator.home || !go_to || go_to === options.home || go_to === "home")  navigator.trigger("home");
                else navigator.home.onNavigate(go_to);
            });

            // home view
            navigator.on("home", ShowHome(options, navigator));
            navigator.on("views:home", ShowHome(options, navigator));

            navigator.on("modal", function(view) {
                navigator.Modal(view);
            });

            // logout view
            navigator.on("logout", function () {
                window.location.reload();
            });

            var routing = new Routing(navigator);
            _DEBUG && console.log("Routing: %o", routing);

        });

        return SPA;
    }
});