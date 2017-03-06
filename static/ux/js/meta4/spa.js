define(["underscore", "backbone", "marionette", "core", "ux", "fact", "iq", "oops", "meta4/util/helpers", "meta4/ux/modals"], function (_, BB, M, meta4, ux, fact, iq, oops, helpers, Modals) {

    var ShowHome = function (options, navigator) {
        return function() {
            if (navigator.home) {
                navigator.home.show();
                return;
            }
            navigator.home = navigator.Home(options.home, navigator);
            navigator.home.triggerMethod("show");

            Backbone.history.start();
        }
    }


    var Routing = function(navigator, options) {

        var routing = Backbone.Router.extend({
            routes: {
                "views:view":   "view",
                "oauth/:code":  "oauth",
                "logout":       "logout"
            },
            view: function(view) {
                // console.log("direct view: views%s", view);
                navigator.trigger("navigate", "views"+view);
            },
            oauth: function() {
                console.log("oauth: %o", arguments);
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
            navigator.user = new ProfileModel(options.user || {label: "Anonymous"});
            navigator.state = new Backbone.Model();

            // handle events
            // navigator.on("all", function(event, scope) {
            //     console.log("on: %o -> %o", event, scope);
            // });

            navigator.on("navigate", function (go_to) {
_DEBUG && console.log("navigator goto: %s", go_to);
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

        SPA.boot = function(options) {
            var _DEBUG = options.debug;
            options = _.extend({}, this.options, options);
            var self = this;
//            console.log("booting %s from %s", options.boot.id, options.boot.url);
            $.ajax({url: options.boot.url, dataType: "json", type: "GET", contentType: "application/json; charset=utf-8",
                success: function(resp) {
                    var result = options.parse(resp);
                    _DEBUG && console.log("loaded %o from %s", result, options.boot.url);
                    if (!result) {
                        self.trigger("error", "application:missing");
                        throw oops.Error("meta4:app:oops:invalid-payload")
                        return;
                    }
                    // hide splash screen (if displayed)
                    if ( (!options.splash.disabled) ) {
                        self.on("started", function() { splash.close(); });
                    }
                    self.trigger("booted", result);
                }
            });
        }

        return SPA;
    }
});