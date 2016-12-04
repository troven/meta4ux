define(["underscore", "backbone", "core"], function (_, Backbone, core) {

    var fact = core.fact;
    console.log("Default Sync: %o", fact);

    return function(method, collection, options) {
        collection.options = collection.options || {}

        var _DEBUG = options.DEBUG || collection.options.debug || fact.DEBUG

        var httpMethod = core.fact.sync._methods[method];

        var url = _.result(collection,"url");
        if (!url) throw "meta4:fact:register:oops:missing-url";

        if (collection.options && collection.options.data) {
            console.warn("Meta4 Instance Disables Remote: %s %o", collection.options.id, collection);
            return;
        }

        var data = method=="read"?collection.options.filter||{}:collection.toJSON()
        _DEBUG && console.log("Meta4 CRUD (%s): %o %o %o %o", method, url, collection, data, options);

        var $future = $.ajax( { url: url, type: httpMethod,
            dataType: "json", data: data && JSON.stringify(data),
            contentType: "application/json; charset=utf-8",
            success: function(response) {
                if (response && response.status == "success" ) {
                    _DEBUG && console.log("Meta4 CRUD Success: %s %s -> %o %o", url, response.status, collection, response);
                    options.success(response.data);
                } else if (response.status) {
                    console.error("Meta4 CRUD Failed: %s %s -> %o", url, response.message, response);
                    options.error && options.error(response);
                    collection.trigger("error", response)
                } else {
                    core.fact.models.trigger("error", collection, options, response)
                }
            }, error: function(response) {
                console.error("Meta4 Error: %s-> %o %o", url, response, arguments);
                options.error && options.error(collection, response);
                alert(url + "-> "+response.statusText)
            } })
        return $future;
    };

});
