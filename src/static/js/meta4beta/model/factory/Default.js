define(["underscore", "backbone", "core",
    "meta4beta/model/sync/Default",
    "backbone_documentmodel", "backbone_filtered", "vendor/backbone-mutators/backbone.mutators",
], function (_, Backbone, core, DefaultSync) {

    return function(options) {

        var fact = core.fact;

        // internal constants
        var _DEBUG = options.debug || fact.DEBUG
        var storeType = options.store || "file"
        var storeURL = options.url || "models/"+storeType

        console.log("Default Factory: (%s) %o => %o", options.id, options, fact);

        // define our collection's Model

        var Model = Backbone.DocumentModel.extend({
            url: function() {
                return core.url(this.collection?this.collection.url:storeURL);
            } ,
            sync: fact.sync.Default,
            mutators: options.mutators,
            defaults: options.defaults,
            validate: fact.validate.model,
            idAttribute: options.idAttribute||fact.idAttribute
        })

        // define new Collection

        var Collection = Backbone.DocumentCollection.extend({
            url: core.url(storeURL),
            sync: fact.sync.Default,
            model: Model
        });

        // new instance of Default collection

        var collection = new Collection();
        collection.options = _.omit(options, ["data"])

        _DEBUG && console.log("Remote Collection (%s): %o %o @ %s", options.id, options, collection, storeURL)
        return collection;
    }

})