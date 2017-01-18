define(["underscore", "backbone", "core",
    "meta4/model/helps", "meta4/model/datatypes",
    "meta4/model/factory/Default", "meta4/model/factory/File", "meta4/model/factory/Local",
    "meta4/model/sync/Default", "meta4/model/sync/Remote", "meta4/model/sync/Local"
], function (_, Backbone, core, helps, datatypes, DefaultFactory, FileFactory, LocalFactory, DefaultSync, RemoteSync, LocalSync) {

    _.extend(Backbone.DocumentModel, Backbone.Mutators.prototype);

    var fact = _.extend(core.fact, {
        factory: {},
        sync: {
            _methods: { 'create': 'POST', 'update': 'PUT', 'patch':  'PATCH', 'delete': 'DELETE', 'read': 'GET' },
        }
    });

    fact.idAttribute = core.idAttribute || "id";
    fact.typeAttribute = core.typeAttribute || "type";
    fact.DEBUG = false || core.DEBUG;

    fact.datatype = datatypes;
    // fact.validators = validators;
    // fact.validate = validates;
    _.extend(fact, helps);

    fact.factory.Default = DefaultFactory;
    fact.factory.File = FileFactory;
    fact.factory.Local = LocalFactory;

    fact.sync.Default = DefaultSync;
    fact.sync.Local = LocalSync;
    fact.sync.Remote = RemoteSync;

    console.log("storage: %o factories: %o", _.keys(fact.sync), _.keys(fact.factory));

    return fact;
});