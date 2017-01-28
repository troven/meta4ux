define(["underscore", "backbone", "core"], function (_, Backbone, core) {

    var fact = core.fact;

    return function(method, collection, options) {

        collection.options = collection.options || {};

        var _DEBUG = options.DEBUG || collection.options.debug || fact.DEBUG;

        var httpMethod = core.fact.sync._methods[method];

        var url = _.result(collection,"url");
        if (!url) throw "meta4:fact:register:oops:missing-url";

        if (collection.options && collection.options.data) {
            console.warn("Instance Disables Remote: %s %o", collection.options.id, collection);
            return;
        }

        if (collection.busy) {
            var elapsed = new Date().getTime()-collection.busy;
            _DEBUG && console.log("Busy: %s for %s ms", collection.options.id, elapsed);
            return false;
        }

        var data = method=="read"?collection.options.filter||{}:collection.toJSON();
        _DEBUG && console.log("Sync (%s / %s): %o %o %o %o", method, httpMethod, url, collection, data, options);

        collection.busy = new Date().getTime();
        collection.trigger("busy");

        var $future = $.ajax( { url: url, type: httpMethod,
            dataType: "json", data: data && JSON.stringify(data),
            contentType: "application/json; charset=utf-8",
            success: function(response) {
                collection.busy = false;
                collection.trigger("done");
                if (response && response.status == "success" ) {
                    _DEBUG && console.log("CRUD Success: %s %s -> %o", url, response.status, response.data);
                    options.success(response.data);
                } else {
                    console.error("CRUD Failed: %s %s -> %o", url, response.message, response);
                    options.error && options.error(response);
                    collection.trigger("error", response);
                }
            }, error: function(response) {
                collection.busy = false;

                collection.trigger("error", response);

                console.error("sync failed: %s-> %o %o", url, response, arguments);
                options.error && options.error(collection, response);
                //
                //
                // alert(url + "-> "+response.statusText);
            }
        });

        return $future;
    };

});
