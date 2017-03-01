define(["jquery", "underscore", "backbone", "core", "iq", "meta4/model/asq", "meta4/model/index", "meta4/model/buttons"], function ($,_,Backbone, core, iq, asq, Fact, buttons) {

/* *****************************************************************************************************************
	Fact: Data / Model Related
**************************************************************************************************************** */

    var fact = core.fact;

	_.extend(fact, {
		models: new Backbone.Model(),

        boot:function(module, options) {
			var self = this;

			self.options = options;
			var _DEBUG = options.debug || fact.DEBUG;
			var baseURL = options.url+options.basePath
_DEBUG && console.log("Module Models: %o %o -> %s", module, options, baseURL)

			_.each(options.models, function(model, id) {
				if (!_.isEmpty(model)) {
					model.id = model.id || id;
					var collection = self.register(model);
_DEBUG && console.log("Boot Model: %s @ %s -> %o -> %o", id, model.url, model, collection);
				}
			});

            self.models = module.models = module.models || self.models;

            if (!self.models.get("buttons")) {
                fact.models.set("buttons", self.Collection(buttons) );
                console.log("Buttons: %o -> %o", self.models.get("buttons"), buttons );
            }


            iq.bubble('error', self.models, navigator);

            module.Filter = self.filter;
            module.Collection = self.Collection;
            module.Model= self.Model;

            return self;
		},

		register: function(options) {
		    var self = this;
			if (!options) throw "meta4:fact:register:oops:missing-options";
			if (!_.isObject(options)) "meta4:fact:register:oops:invalid-options";

			var _DEBUG = options.debug || fact.DEBUG;
			var id = options[fact.idAttribute];
            if (!id) throw "meta4:fact:register:oops:missing-"+fact.idAttribute;

			var collection = self.models.get(id)
			if (collection) {
console.warn("Duplicate Collection: %s %o %o", id, fact.models, options)
				throw "meta4:fact:register:duplicate#"+id;
			}

			if (options.singleton) {
				collection = self.Model(options);
//console.error("Singleton (%s): %o %o", id, options, collection)
				if (!collection) throw "meta4:fact:register:invalid-singleton#"+id;
			} else {
_DEBUG && console.log("Register Collection: %s %o", options.id, options)
				collection = fact.Collection(options);
				if (!collection) throw "meta4:fact:register:invalid-collection#"+id;

				collection.options = options

				if (options.prefetch) {
					setTimeout(function() {
_DEBUG && console.log("Pre-Fetch Collection: %s %o", options.id, collection)
						collection.fetch();
					}, 10)
				}
			}

			fact.models.set(id, collection);
            iq.bubble('error', collection, self.models);
            iq.bubble('busy', collection, self.models);
            iq.bubble('done', collection, self.models);

            return collection;
		},

		Model: function (options) {
			var _options = _.extend({
				sync: fact.sync.Remote
			}, options);

			var _Model = Backbone.DocumentModel.extend(_options);
			var model = new _Model();

			core.iq.aware(model, options.iq || options.when );

			return model
		},

		Collection: function(options) {
			var _DEBUG = options.debug || fact.DEBUG;
			if (!options) throw "meta4:fact:Collection:oops:missing-options";
			options.type = options.type || "Local";
//_DEBUG && console.log("Fact Collection: %s %o ", options.id, options)

			var collection = null

            // resolve collection (string, function, options
			if (_.isString(options)) {
                return fact.models.get(options)
            } else if (_.isFunction(options)) {
				options = options();
				collection = fact.factory.Local( options )
			} else if (_.isArray(options)) {
				options = { data: options }
				collection = fact.factory.Local(options)
//console.log("Local Array: %o %o", options, collection)
				collection.add( options.data );
			} else if (_.isObject(options)) {
				var id = options[fact.idAttribute]
				if (!id) throw "meta4:fact:Collection:oops:missing-"+fact.idAttribute;

				// lookup by 'id'
				collection = fact.models.get(id)
				if (collection) {
					return collection;
				}

				if (!collection && _.isString(options.collection) && options.collection!=options.id ) {
				    collection = fact.models.get(options.collection);
                    console.log("FACADE: %o -> %o", options, options.collection)
                }

                if (!collection) {
                    var type = options[fact.typeAttribute];
                    if (!type) {
                        throw "meta4:fact:Collection:oops:missing-"+fact.typeAttribute;
                    }

                    // lookup by 'type' [ Local / Remote / etc ]
                    var Finder = fact.factory[type];
                    if (!Finder) throw "meta4:fact:Collection:oops:missing-finder#"+type;

                    options = fact.mutate(options);

                    // instantiate typed-finder
                    collection = new Finder(options);
                    collection[fact.idAttribute] = id;
                }

				if (options.data && _.isArray(options.data)) {
					collection.add(options.data)
_DEBUG && console.log("Instance Data: %o %o", options.data, collection, options.data.length == collection.models.length)
				}
			} else  throw new Error("meta4:fact:collection:oops:invalid-collection-reference");

			if (options.schema) {
				collection.schema = new Backbone.Collection(collection.model.schema = this._buildSchema(options.schema))
_DEBUG && console.log("Collection Schema: %s %o %o ", id, collection, collection.schema);
			}

			core.iq.aware(collection, options.iq || options.when);
			if (!_.isUndefined(options.filter) && options.filter!==false) {
//_DEBUG && console.log("Filtered Collection: %o %o %o ", collection, collection.model.schema, options.filter)
				return this.filter(collection, options.filter===true?{}:options.filter)
			}

_DEBUG && console.log("%s Collection: %o %o %o ", options.id, collection, collection.model.schema, options.when || "no IQ")
			return collection;
		},

		_buildSchema: function(schema) {
			var self = this
			var _schema = [];
			_.each(schema, function(field, id) {
                field = field || {};
				if (_.isString(field)) field = { id: id, type: field }
				field = _.extend({ id: id, type: "string", validators: [], label: field.label || field.id || id, editable: true, required: false }, field)
				if (field.required && !field.validators) {
					var validator = fact.validators[field.type];
					if (validator) field.validators = [validator];
				}
fact.DEBUG && console.log("Fact Schema() ", field.id, field, field.validators);
				_schema.push(field);
			})
			return _schema;
		},

		localName: function(globalName) {
//			if(!globalName) return throw "meta4:fact:missing-localname";
			if(!globalName) return null;
			var ix = globalName.lastIndexOf("#");
			if (ix<0) ix = globalName.lastIndexOf("/");
			if (ix<0) ix = globalName.lastIndexOf(":");
			return ix>=0?globalName.substring(ix+1):globalName;
		},

		filter: function(collection, query) {
			if (!collection) throw "meta4:oops:fact:missing-filter-collection"

			if (query===true || !query || _.isEmpty(query)) {
				query = collection.filters || new Backbone.Model();
			}

			var fn = asq.compile(query);
            console.log("FILTER: %o -> %o -> %s", collection, query, fn);
            if (!fn) throw "meta4:oops:fact:missing-filter-fn#"+query;

			var filtered = fact.Collection([]);
			filtered.filters = query;
			filtered.options = collection.options;
			filtered.id = "filtered_"+collection.id;
            filtered.original = collection;

			var refresh = function() {
			    var self = this;
				var results = collection.filter(function(m) {
				    return fn(m.attributes);
				} );
                console.log("RE-FILTER: %o -> %o", query, results)
				filtered.reset(results);
//				filtered.trigger("filter", query)
				return filtered;
			}

//			filtered.__collection__ = collection
//			collection.on("add", refresh);
			collection.on("change", refresh);
            collection.on("reloaded", refresh);

			filtered.fetch = function(options) {
				return collection.fetch(options);
			}
			filtered.synced = collection.synced;
            collection.refresh = refresh;
//			collection.on("destroy", function() { filtered.destroy() })
//			filtered.filters.on && filtered.filters.on("change", refresh);

            collection.refresh();
			return filtered;
		}

    });

	fact.validate = {

	}

	return fact;

});
