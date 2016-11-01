define(["underscore", "backbone", "core", "meta4beta/model/factory/Default"], function (_, Backbone, core) {

    var fact = core.fact;

    return function(_options) {

        var options = fact.mutate(_options)

        // internal constants
        var _DEBUG = options.debug || fact.DEBUG
        var storeType = options.store || "file"
        var storeURL = options.url || "/models/"+storeType

        // define our collection's Model

        var Model = Backbone.DocumentModel.extend({
            url: function() { return this.collection?this.collection.url:storeURL } ,
            sync: fact.sync.remote,
            mutators: options.mutators,
            defaults: options.defaults,
            validate: fact.validate.model,
            idAttribute: options.idAttribute||idAttribute
        })

        // define new Collection

        var Collection = Backbone.DocumentCollection.extend({
            url: storeURL,
            sync: fact.sync.remote,
            model: Model
        });

        // new instance of Default collection

        var collection = new Collection();
        collection.options = _.omit(options, ["data"])

        _DEBUG && console.log("Remote Collection (%s): %o %o @ %s", options.id, options, collection, storeURL)
        return collection;
    }

    return fact;

})
