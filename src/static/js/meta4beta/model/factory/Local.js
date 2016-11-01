define(["underscore", "backbone", "core", "meta4beta/model/factory/Default"], function (_, Backbone, core) {

    var fact = core.fact;

    return function(_options) {
        _options = _options || {}

        var options = core.fact.mutate(_options)
        var _DEBUG = options.debug || fact.DEBUG

        var Model = Backbone.DocumentModel.extend({
            sync: fact.sync.local,
            mutators: options.mutators,
            defaults: options.defaults,
            validate: fact.validate.model,
            idAttribute: options.idAttribute||fact.idAttribute
        })

        var Collection = Backbone.DocumentCollection.extend({
            sync: fact.sync.local,
            model: Model
        });

        var collection = new Collection();
_DEBUG && console.log("Local Collection:  %o %o", options, collection)
        collection.options = _.omit(options, ["data"])

        return collection;
    }
})

