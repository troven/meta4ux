define(["underscore"], function(_) {

    return {
        RouteBuilder: function(methods) {
            var routes = {};
            _.each(methods, function(fn, method) {
                if (_.isFunction(fn)) {
                    routes[method] = method;
                }
                if (_.isString(fn)) {
                    routes[method] = methods[fn];
                }
            });
            return routes;
        },

        Router: function(options) {
            // TODO: integrate FSM - only execute route on valid transition
            options || (options = {});

            var Router = M.AppRouter.extend({
                controller: options.controller,
                appRoutes: options.routes,
                execute: function(callback, args, name) {
                    console.log("FLOW ROUTE: %o %s", args, name);
                    return M.AppRouter.prototype.execute.call(this, callback, args, name);
                }
            });

            return new Router();
        }
    }
});