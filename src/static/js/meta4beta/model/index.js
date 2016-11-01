define(["underscore", "backbone", "core",
    "meta4beta/model/helps", "meta4beta/model/datatypes", "meta4beta/model/validators",  "meta4beta/model/validates",
    "meta4beta/model/factory/Default", "meta4beta/model/factory/File", "meta4beta/model/factory/Local",
    "meta4beta/model/sync/Default", "meta4beta/model/sync/Remote", "meta4beta/model/sync/Local"
], function (_, Backbone, core, helps, datatypes, validators, validates, DefaultFactory, FileFactory, LocalFactory, DefaultSync, RemoteSync, LocalSync) {

    _.extend(Backbone.DocumentModel, Backbone.Mutators.prototype);

    var fact= core.fact;

    _.extend(fact, {
        factory: {},
        sync: {
            _methods: { 'create': 'POST', 'update': 'PUT', 'patch':  'PATCH', 'delete': 'DELETE', 'read': 'GET' },
        }
    });

    fact.idAttribute = core.idAttribute || "_id";
    fact.typeAttribute = core.typeAttribute || "type";
    fact.DEBUG = false || core.DEBUG;

    fact.datatype = datatypes;
    fact.validators = validators;
    fact.validate = validates;
    _.extend(fact, helps);

    fact.factory.Default = DefaultFactory;
    fact.factory.File = FileFactory;
    fact.factory.Local = LocalFactory;

    fact.sync.Default = DefaultSync;
    fact.sync.Local = LocalSync;
    fact.sync.Remote = RemoteSync;

    console.log("Fact Models: %o -> %o", fact.sync, fact.factory);
    return fact;

});