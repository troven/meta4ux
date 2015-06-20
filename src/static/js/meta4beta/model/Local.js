define(["underscore", "backbone", "fact", "meta4beta/model/Default"], function (_, Backbone, fact) {

    fact.factory.Local = function(_options) {
        _options = _options || {}

        var options = fact.mutate(_options)
        var _DEBUG = options.debug || fact.DEBUG

        var Model = Backbone.DocumentModel.extend({
            sync: fact.crud.local,
            mutators: options.mutators,
            defaults: options.defaults,
            validate: fact.validate.model,
            idAttribute: options.idAttribute||fact.idAttribute
        })

        var Collection = Backbone.DocumentCollection.extend({
            sync: fact.crud.local,
            model: Model
        });

        var collection = new Collection();
_DEBUG && console.log("Local Collection:  %o %o", options, collection)
        collection.options = _.omit(options, ["data"])

        return collection;
    }
})

