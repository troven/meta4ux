define(["underscore", "backbone", "core"
], function (_, Backbone, core) {

    var fact = core.fact;

    return function(method, model, options) {
        options || (options = {});
        var _DEBUG = options.debug || fact.DEBUG

        _DEBUG && console.log("Local CRUD", method, model, options);

        var key = 'LocalModel#' + model.id;
        switch (method) {
            case 'create':
                localStorage.setItem(key, JSON.stringify(model));
                break;
            case 'read':
                var result = localStorage.getItem(key);
                if (result) {
                    result = JSON.parse(result);
                    options.success && options.success(result);
                } else if (options.error) {
                    options.error("Could not find LocalModel id=" + model.id);
                }
                break;
            case 'update':
                localStorage.setItem(key, JSON.stringify(model));
                break;
            case 'delete':
                localStorage.removeItem(key);
                break;
        }
    };

});
