define(["jquery", "underscore", "backbone", "core", "iq", "asq", "meta4beta/model/index"], function ($,_,Backbone, core, iq, asq, Fact) {

/* *****************************************************************************************************************
	Fact: Data / Model Related
**************************************************************************************************************** */

    var fact = core.fact;
    console.log("Core Facts: %o", fact);

	_.extend(fact, {
		models: new Backbone.Model(),

        boot:function(module, options) {
			var self=this;
			self._module = module;
			self.options = options;
			var _DEBUG = options.DEBUG || fact.DEBUG;
			var baseURL = options.url+options.basePath
//_DEBUG && console.log("Module Models: %o %o -> %s", module, options, baseURL)

			_.each(options.models, function(model, id) {
				if (!_.isEmpty(model)) {
					model.id = model.id || id
//_DEBUG && console.log("Boot Model: %s @ %s -> %o", id, model.url, model)
					var collection = self.register(model);
				}
			})
		},

		register: function(options) {
			if (!options) throw "meta4:fact:register:oops:missing-options";
			if (!_.isObject(options)) "meta4:fact:register:oops:invalid-options";

			var _DEBUG = options.debug || fact.DEBUG;
			var id = options[fact.idAttribute];
            if (!id) throw "meta4:fact:register:oops:missing-"+fact.idAttribute;

			var collection = fact.models.get(id)
			if (collection) {
console.warn("Duplicate Collection: %s %o %o", id, fact.models, options)
				throw "meta4:fact:register:duplicate#"+id;
			}

			if (options.singleton) {
				collection = fact.Model(options);
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
			var _DEBUG = options.debug || fact.DEBUG
			if (!options) throw "meta4:fact:Collection:oops:missing-options";
			options.type = options.type || "Local"
//_DEBUG && console.log("Fact Collection: %s %o ", options.id, options)

			var collection = null

			if (_.isString(options)) {
                return fact.models.get(options)
            } else if (_.isFunction(options)) {
				options = options();
				collection = fact.factory.Local( options )
			} else if (_.isArray(options)) {
				options = { data: options }
				collection = fact.factory.Local(options)
//console.log("Local Array: %o %o", options, collection)
				collection.add( options.data )
			} else if (_.isObject(options)) {
				var id = options[fact.idAttribute]
				if (!id) throw "meta4:fact:Collection:oops:missing-"+fact.idAttribute;

				// lookup by 'id'
				collection = fact.models.get(id)
				if (collection) {
					return collection;
				}

				var type = options[fact.typeAttribute]
				if (!type) {
					throw "meta4:fact:Collection:oops:missing-"+fact.typeAttribute;
				}

				// lookup by 'type' [ Local / Remote / etc ]
				var Finder = fact.factory[type]
				if (!Finder) throw "meta4:fact:Collection:oops:missing-finder#"+type;

                options = fact.mutate(options);

                // instantiate typed-finder
				collection = new Finder(options);
				collection[fact.idAttribute] = id;

				if (options.data && _.isArray(options.data)) {
					collection.add(options.data)
_DEBUG && console.log("Instance Data: %o %o", options.data, collection, options.data.length == collection.models.length)
				}
			}

			var id = options[fact.idAttribute]
			if (id) {
				collection.schema = new Backbone.Collection(collection.model.schema = this._buildSchema(options.schema))
_DEBUG && console.log("Fact Schema: %s %o %o ", id, collection, collection.schema)
			}

			core.iq.aware(collection, options.iq || options.when);
			if (!_.isUndefined(options.filter) && options.filter!==false) {
//_DEBUG && console.log("Filtered Collection: %o %o %o ", collection, collection.model.schema, options.filter)
				return this.filter(collection, options.filter===true?{}:options.filter)
			}

_DEBUG && console.log("Fact Collection: %o %o %o ", collection, collection.model.schema, options.when || "no IQ")
			return collection;
		},

		_buildSchema: function(schema) {
			var self = this
			var _schema = [];
			_.each(schema, function(field, id) {
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
			if (!query || _.isEmpty(query)) {
				query = collection.filters || new Backbone.Model()
			}
// console.log("Attached Filter: %o %o", collection, query)
			var fn = asq.compile(query)
			var filtered = fact.Collection([]);
			filtered.filters = query
			filtered.options = collection.options
			filtered.id = "filtered_"+collection.id

			var refresh = function() {
				var results = collection.filter(function(a) { return fn(a.attributes) } )
// console.log("refresh: %o %o -> %o", query, collection, results)
				filtered.reset(results)
//				filtered.trigger("filter", query)
				return filtered
			}

//			filtered.__collection__ = collection
			collection.on("add", refresh)
			collection.on("change", refresh)
			filtered.fetch = function(options) {
				return collection.fetch(options)
			}
//			collection.on("destroy", function() { filtered.destroy() })
			filtered.filters.on && filtered.filters.on("change", refresh)

			return refresh();
		}

    });

	fact.validate = {

	}

	return fact;

});
