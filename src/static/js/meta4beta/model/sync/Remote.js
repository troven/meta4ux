define(["underscore", "backbone", "core"
], function (_, Backbone, core) {

    var fact = core.fact;

    return function(method, collection, options) {
        var isModel = collection.collection?true:false
        collection.options = collection.options || {}

        var _DEBUG = options.DEBUG || collection.options.debug || fact.DEBUG;
        _DEBUG && console.log("Remote %s Sync: %s -> %s %o %o %o", _DEBUG?"DEBUG":"", collection.id, method, collection, collection.options, options)

        if (!isModel && collection.options.data) {
            console.warn("Instance Data - Ignore Remote %s %s %o %o", collection.id, method, collection, collection.options, options)
            return;
        }
        var httpMethod = core.fact.sync._methods[method];
        var id = isModel?collection.collection[fact.idAttribute]:collection[fact.idAttribute]
        var url = _.result(collection,"url");
        if (!url) throw "meta4:fact:register:oops:missing-url";

        var self = this
        var data = _.extend({}.options);
//				if (httpMethod == "GET") {
//					var filterOn = (options.filter===true?options:options.filter)
//					if (filterOn) {
//						url+= "&json="+encodeURIComponent(JSON.stringify(options.filter))
//_DEBUG && console.log("Remote Filter: %s %o %o -> %o %o", method, collection, options, options.filter, data)
//					}
//				} else {
//					data.id = id
//_DEBUG && console.log("Remote Operation: %s %o %o -> %o %o", method, collection, options, options.filter, data)
//					data.json = collection.toJSON()
//				}

        _DEBUG && console.log("Remote CRUD (%s/%s): %o %s, %s %o %o %o", httpMethod, method, this, id?id:"New Model", url, collection, data, options);

        var $future = $.ajax( { url: url, type: httpMethod,
            dataType: "json", data: data && JSON.stringify(data),
            contentType: "application/json; charset=utf-8",
            success: function(response) {
                if (response && response.data) {
                    _DEBUG && console.log("Remote CRUD Success: %s %o %o", url, collection, response);
                    options.success(response.data);
                } else {
                    console.error("Remote CRUD Error: %s %s -> %o %o", url, id, response, arguments);
                    options.error && options.error(response);
                    core.fact.models.trigger("error", collection, options, response)
                    collection.trigger("error", response)
                }
            }, error: function(response) {
                console.error("Remote Error: %s %s -> %o %o", url, id, response, arguments);
                options.error && options.error(collection, response);
            } })
        return $future;
    };

});