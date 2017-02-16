define(["underscore", "backbone", "core",
    "meta4/model/sync/Default", "meta4/model/validates",
    "backbone_documentmodel", "backbone_filtered", "vendor/backbone-mutators/backbone.mutators",
], function ( _, Backbone, core, DefaultSync, validates ) {

    var fact = core.fact;

    if (!DefaultSync) throw "Missing DefaultSync";

    return function(options) {

        // internal constants
        var _DEBUG = options.debug || fact.DEBUG;
        var storeType = options.store = options.store || options.id;
        var storeURL = options.url = options.url || "models/"+storeType;

        _DEBUG && console.log("Default Factory: (%s) => %o", options.id, options);

        if (!validates.model) throw new Error("meta4:fact:register:oops:missing-model-validate");

        // define our collection's Model

        var Model = Backbone.DocumentModel.extend({
            url: function() {
                return core.url(this.collection?this.collection.url:storeURL);
            },
            type: storeType,
            sync: DefaultSync,
            mutators: options.mutators,
            defaults: _.isObject(options.defaults)?options.defaults:{},
            schema: options.schema,
            validate: validates.model,
            idAttribute: options.idAttribute||fact.idAttribute
        })

        // define new Collection

        var Collection = Backbone.DocumentCollection.extend({
            url: core.url(storeURL),
            type: storeType,
            schema: options.schema,
            sync: DefaultSync,
            model: Model
        });

        // new instance of Default collection

        var collection = new Collection();
        collection.options = _.omit(options, ["data"]);

        // _DEBUG && console.log("Default Collection: (%s): @ %s --> %o", options.id, storeURL, collection);
        return collection;
    }

})