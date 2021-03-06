define(["underscore", "backbone", "core",
    "meta4/model/sync/Default", "meta4/model/validates",
    "backbone_documentmodel", "backbone_filtered", "vendor/backbone-mutators/backbone.mutators",
], function ( _, Backbone, core, DefaultSync, validates ) {

    var fact = core.fact;

    var Models = function(options) {

        // internal constants
        var _DEBUG = options.debug || fact.DEBUG;
        var storeType = options.store || "file"
        var storeURL = options.url || "models/" + storeType

        _DEBUG && console.log("Model: DocumentModel: (%s) => %o -> %o", options.id, fact, validates);

        if (!validates.model) throw new Error("meta4:fact:register:oops:missing-model-validate");

        // define our collection's Model

        var Model = Backbone.DocumentModel.extend({
            url: function () {
                return core.url(this.collection ? this.collection.url : storeURL);
            },
            sync: fact.sync.Default,
            mutators: options.mutators,
            defaults: _.isObject(options.defaults)?options.defaults:{},
            validate: validates.model,
            idAttribute: options.idAttribute || fact.idAttribute
        });

        return Model;
    }

    // define new Collection
    var Collections = function(options) {

        // internal constants
        var _DEBUG = options.debug || fact.DEBUG;
        var storeType = options.store || "file"
        var storeURL = options.url || "models/" + storeType

        var Collection = Backbone.DocumentCollection.extend({
            url: core.url(storeURL),
            sync: fact.sync.Default,
            model: Model
        });

        // new instance of Default collection

        var collection = new Collection();
        collection.options = _.omit(options, ["data"]);

        _DEBUG && console.log("Collection: DocumentModel: (%s): @ %s", options.id, storeURL);
        return collection;
    }

    return { Model: Models, Collection: Collections }

})