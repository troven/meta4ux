define(["underscore", "backbone", "core", "default"
], function (_, Backbone, core, DefaultController) {

    var controllers = {
        default: DefaultController
    };

    return function(type, options) {
        var DEBUG = options.debug?true:false;

        var Controller = controllers[type];

        var ctrl = new Controller(options);

        DEBUG && console.log("Controllers: %o -> %s -> %o", controllers, type, ctrl);

        return ctrl;
    }

});