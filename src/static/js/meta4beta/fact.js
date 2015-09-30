define(["jquery", "underscore", "backbone", "core", "iq", "asq"], function ($,_,Backbone, core, iq, asq) {

/* *****************************************************************************************************************
	Fact: Data / Model Related
**************************************************************************************************************** */

    var fact = core.fact = core.fact || {}

console.log("Initialize meta4models: %o", fact)

	fact.idAttribute = core.idAttribute || "_id";
	fact.typeAttribute = core.typeAttribute || "type";
	fact.DEBUG = false || core.DEBUG;

	_.extend(fact, {
		models: new Backbone.Model(),
        factory: {},

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

		mutate: function(options) {
			if (!options) return
			if (options.mutators) {
				_.each(options.mutators, function(fn, name) {
					options[name] = core.iq.get(fn)
				})
			}
			return options;
		},

		crud: {
			_methods: { 'create': 'POST', 'update': 'PUT', 'patch':  'PATCH', 'delete': 'DELETE', 'read': 'GET' },
			remote: function(method, collection, options) {
			    var isModel = collection.collection?true:false
				collection.options = collection.options || {}

				var _DEBUG = options.DEBUG || collection.options.debug || fact.DEBUG
_DEBUG && console.log("Remote %s Sync: %s -> %s %o %o %o", _DEBUG?"DEBUG":"", collection.id, method, collection, collection.options, options)

if (!isModel && collection.options.data) {
console.warn("Instance Data - Ignore Remote %s %s %o %o", collection.id, method, collection, collection.options, options)
	return;
}
			    var httpMethod = core.fact.crud._methods[method];
				var id = isModel?collection.collection[fact.idAttribute]:collection[fact.idAttribute]
				var url = _.result(collection,"url");
				if (!url) throw "meta4:fact:register:oops:missing-url";

				var self = this
				var data = _.extend({}.options);
//				if (httpMethod == "GET") {
//					var filterOn = (options.filter===true?options:options.filter)
//					if (filterOn) {
//						url+= "&json="+encodeURIComponent(JSON.stringify(options.filter))
//_DEBUG && console.log("Remote Filter: %s %o %o -> %o %o", method, collection, options, options.filter, data)
//					}
//				} else {
//					data.id = id
//_DEBUG && console.log("Remote Operation: %s %o %o -> %o %o", method, collection, options, options.filter, data)
//					data.json = collection.toJSON()
//				}

_DEBUG && console.log("Remote CRUD (%s/%s): %o %s, %s %o %o %o", httpMethod, method, this, id?id:"New Model", url, collection, data, options);

				var $future = $.ajax( { url: url, type: httpMethod,
					dataType: "json", data: data && JSON.stringify(data),
					contentType: "application/json; charset=utf-8",
					success: function(response) {
						if (response && response.data) {
_DEBUG && console.log("Remote CRUD Success: %s %o %o", url, collection, response);
							options.success(response.data);
						} else {
console.error("Remote CRUD Error: %s %s -> %o %o", url, id, response, arguments);
							options.error && options.error(response);
							core.fact.models.trigger("error", collection, options, response)
							collection.trigger("error", response)
						}
				}, error: function(response) {
console.error("Remote Error: %s %s -> %o %o", url, id, response, arguments);
					options.error && options.error(collection, response);
				} })
				return $future;
			},

			meta4beta: function(method, collection, options) {
				collection.options = collection.options || {}

				var _DEBUG = options.DEBUG || collection.options.debug || fact.DEBUG

			    var httpMethod = core.fact.crud._methods[method];

				var url = _.result(collection,"url");
				if (!url) throw "meta4:fact:register:oops:missing-url";

				if (collection.options && collection.options.data) {
//_DEBUG &&
console.warn("Meta4 Instance Disables Remote: %s %o", collection.options.id, collection);
					return;
				}

				var self = this
				var data = method=="read"?collection.options.filter||{}:collection.toJSON()
_DEBUG && console.log("Meta4 CRUD (%s): %o %o %o %o", method, url, collection, data, options);

				var $future = $.ajax( { url: url, type: httpMethod,
					dataType: "json", data: data && JSON.stringify(data),
					contentType: "application/json; charset=utf-8",
					success: function(response) {
						if (response && response.status == "success" ) {
_DEBUG && console.log("Meta4 CRUD Success: %s %s -> %o %o", url, response.status, collection, response);
							options.success(response.data);
						} else if (response.status) {
console.error("Meta4 CRUD Failed: %s %s -> %o", url, response.message, response);
							options.error && options.error(response);
							collection.trigger("error", response)
						} else {
							core.fact.models.trigger("error", collection, options, response)
						}
				}, error: function(response) {
console.error("Meta4 Error: %s-> %o %o", url, response, arguments);
					options.error && options.error(collection, response);
						alert(url + "-> "+response.statusText)
				} })
				return $future;
			},

			local: function(method, model, options) {
				options || (options = {});
				var _DEBUG = options.debug || fact.DEBUG

_DEBUG && console.log("Local CRUD", method, model, options);

				var key = 'LocalModel#' + model.id;
				switch (method) {
					case 'create':
						localStorage.setItem(key, JSON.stringify(model));
						break;
					case 'read':
						var result = localStorage.getItem(key);
						if (result) {
							result = JSON.parse(result);
							options.success && options.success(result);
						} else if (options.error) {
							options.error("Could not find LocalModel id=" + model.id);
						}
						break;
					case 'update':
						localStorage.setItem(key, JSON.stringify(model));
						break;
					case 'delete':
						localStorage.removeItem(key);
						break;
				}
			}
		},

		register: function(options) {
			if (!options) throw "meta4:fact:register:oops:missing-options";
			if (!_.isObject(options)) "meta4:fact:register:oops:invalid-options";

			var _DEBUG = options.debug || fact.DEBUG
			var id = options[fact.idAttribute]
            if (!id) throw "meta4:fact:register:oops:missing-"+fact.idAttribute;

			var collection = core.fact.models.get(id)
			if (collection) {
console.warn("Duplicate Collection: %s %o %o", id, core.fact.models, options)
				throw "meta4:fact:register:duplicate#"+id;
			}

			if (options.singleton) {
				collection = core.fact.Model(options);
//console.error("Singleton (%s): %o %o", id, options, collection)
				if (!collection) throw "meta4:fact:register:invalid-singleton#"+id;
			} else {
_DEBUG && console.log("Register Collection: %s %o", options.id, options)
				collection = core.fact.Collection(options);
				if (!collection) throw "meta4:fact:register:invalid-collection#"+id;

				collection.options = options

				if (options.prefetch) {
					setTimeout(function() {
_DEBUG && console.log("Pre-Fetch Collection: %s %o", options.id, collection)
						collection.fetch();
					}, 10)
				}
			}

			core.fact.models.set(id, collection);
			return collection;
		},

		Model: function (options) {
			var _options = _.extend({
				sync: core.fact.crud.remote
			}, options)
			var _Model = Backbone.DocumentModel.extend(_options)
			var model = new _Model()

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
                return core.fact.models.get(options)
            } else if (_.isFunction(options)) {
				options = options();
				collection = core.fact.factory.Local( options )
			} else if (_.isArray(options)) {
				options = { data: options }
				collection = core.fact.factory.Local(options)
//console.log("Local Array: %o %o", options, collection)
				collection.add( options.data )
			} else if (_.isObject(options)) {
				var id = options[fact.idAttribute]
				if (!id) throw "meta4:fact:Collection:oops:missing-"+fact.idAttribute;

				// lookup by 'id'
				collection = core.fact.models.get(id)
				if (collection) {
					return collection;
				}

				var type = options[fact.typeAttribute]
				if (!type) {
					throw "meta4:fact:Collection:oops:missing-"+fact.typeAttribute;
				}

				// lookup by 'type' [ Local / Remote / etc ]
				var Finder = core.fact.factory[type]
				if (!Finder) throw "meta4:fact:Collection:oops:missing-finder#"+type;

				// instantiate typed-finder
				collection = new Finder(options);
				collection[fact.idAttribute] = id

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
			var _schema = []
			_.each(schema, function(field, id) {
				if (_.isString(field)) field = { id: id, type: field }
				field = _.extend({ id: id, type: "string", validators: [], label: field.label || field.id || id, editable: true, required: false }, field)
				if (field.required && !field.validators) {
					var validator = core.fact.validators[field.type]
					if (validator) field.validators = [validator]
				}
fact.DEBUG && console.log("Fact Schema() ", field.id, field, field.validators)
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
			var filtered = core.fact.Collection([]);
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

	/**
		Simple data-type converters
	**/

	core.fact.datatype = {
		rq2rdf: {
			toURI: function(that, source) {
				if (_.isObject(that) && that.ID) {
// handle blank nodes - ensure they are globalized
//console.log("BLANK: %o", that, source);
					return "<urn:local:"+that.ID+">";
				} else return "<"+that+">";
			},
			to: function(that, source) {
				if (_.isString(that)) {
					return "\""+that+"\"";
				} else if (that.label) {
					// LITERAL
					try {
						return "\""+that.label+"\""+(that.datatype?"^^<"+that.datatype.namespace+that.datatype.localName+">":"");
					} catch(e) {
fact.DEBUG && console.warn("Parse Error:", that, e);
						return "\""+that.label+"\"^^xsd:simpleType";
					}
				} else if (that.namespace || that.localName) {
					// CNAME / URI
					return "<"+that.namespace+that.localName+">";
				} else if (that.ID) {
					// BNODE
// handle blank nodes - ensure they are globalized
//console.log("BNODE: ", that, that.ID, source);
					return "<urn:local:"+that.ID+">";
				}

			}
		},
		xsd2json: {
			to: function(that) {
				return that;
			}
		}
	}

	/**
		Generic data validation
	**/

	core.fact.validators = {
		"required": {
			message: "required",
			fn: function(v) { return v===false||v?true:false }
		},
		"email": {
			message: "invalid email address",
			pattern: /^[\w\-]{1,}([\w\-\+.]{1,1}[\w\-]{1,}){0,}[@][\w\-]{1,}([.]([\w\-]{1,})){1,3}$/
		},
		"url": {
			message: "not valid URL",
			pattern: /^(http|https):\/\/(([A-Z0-9][A-Z0-9_\-]*)(\.[A-Z0-9][A-Z0-9_\-]*)+)(:(\d+))?\/?/i
		},
		"id": {
			message: "Invalid ID [4+ characters, A-Z/0-9 no spaces]",
			pattern: /^\S+\w{4,255}\S{1,}/
		},
		"number": {
			message: "Invalid number",
			pattern: /^[0-9]*\.?[0-9]*?$/
		},
		"currency": {
			message: "Invalid number",
			pattern: /^[0-9]*\.?[0-9]*?$/
		},
		"iso8601": {
			message: "Invalid date time",
			pattern: /^(19[0-9]{2}|[2-9][0-9]{3})-((0(1|3|5|7|8)|10|12)-(0[1-9]|1[0-9]|2[0-9]|3[0-1])|(0(4|6|9)|11)-(0[1-9]|1[0-9]|2[0-9]|30)|(02)-(0[1-9]|1[0-9]|2[0-9]))\x20(0[0-9]|1[0-9]|2[0-3])(:[0-5][0-9]){2}$/
		},
		"password": {
			message: "Password too weak. 6+ characters, letter & numbers.",
			pattern: /^(?=.*\d)(?=.*[a-zA-Z])(?!.*[\W_\x7B-\xFF]).{6,255}$/
		},
		"creditCard": {
			message: "Invalid credit card",
			pattern: /^((4\d{3})|(5[1-5]\d{2})|(6011))-?\d{4}-?\d{4}-?\d{4}|3[4,7]\d{13}$/
		},
		"isbn": {
			message: "Invalid ISBN",
			pattern: /^ISBN\s(?=[-0-9xX ]{13}$)(?:[0-9]+[- ]){3}[0-9]*[xX0-9]$/
		},
		"date": {
			message: "Invalid date (dd/mm/yyyy)",
			pattern: /^([0-1][0-9]|[2][0-3]):([0-5][0-9])$/
		},
		"time": {
			message: "Invalid time (hh:mm)",
			pattern: /^([0-1][0-9]|[2][0-3]):([0-5][0-9])$/
		},
		"datetime": {
			message: "Invalid date / time (dd/mm/yyyy hh:mm)",
			pattern: /^((((([13578])|(1[0-2]))[\-\/\s]?(([1-9])|([1-2][0-9])|(3[01])))|((([469])|(11))[\-\/\s]?(([1-9])|([1-2][0-9])|(30)))|(2[\-\/\s]?(([1-9])|([1-2][0-9]))))[\-\/\s]?\d{4})(\s((([1-9])|(1[02]))\:([0-5][0-9])((\s)|(\:([0-5][0-9])\s))([AM|PM|am|pm]{2,2})))?$/
		}
	}

	core.fact.validate = {

		model: function(attributes, options) {
			var self = this
			var errors = []
			options = options || { debug: true }
			var schema = options.schema || (self.collection&&self.collection.options&&self.collection.options.schema?self.collection.options.schema:{})
			var _DEBUG = options.debug || fact.DEBUG
//_DEBUG&&
console.log("Validate Model: %o %o / %o %o", this, schema, attributes, options)

			var validate = core.fact.validate
			attributes = attributes || this.attributes
			options = options || this.options

			_.each(schema, function(meta,k) {
//console.log("Validate Attr: %o %o", k, meta)
				var v = attributes[k]
				if (meta) {
					// ubiquitous, so add some syntax sugar
					if (meta.required) {
						var error = validate.attribute(k, v, attributes, core.fact.validators.required )
						error && errors.push(error)
					}

					// field-specific validation
					var error = validate.attribute(k, v, attributes, meta.validators)
					error && errors.push(error)

					// generic field-type validation
					var type = meta[fact.typeAttribute]
					if (type) {
						var validators = core.fact.validators[type.toLowerCase()]
//console.log("Validate Type: %o %o %o / %o %o", k, v, type, validators, meta.validators)
						var error = validate.attribute(k, v, attributes, [ validators ] )
						error && errors.push(error)
					}
				}
			})

			var hasErrors = (errors && errors.length)
            if (hasErrors) {
console.warn("Model Invalid: %o %o", self, errors)
                self.trigger && self.trigger("invalid", errors)
                return errors;
            }
		},

		attribute: function(fieldId, value, attributes, validators) {
			if (!validators) return false
			var error = false
// DEBUG && console.debug("validateField (%s:=%s) %o", fieldId, value, validators)
			_.each(validators, function(validator) {
				var validate = core.fact.validators[validator]

				if (_.isObject(validate)) {
					var valid = true
					var pattern = validate.pattern || validate.regexp
					if (pattern) {
						var regex = new RegExp(pattern)
						valid = value.match(regex)?true:false
					}
					if (valid && validate.fn && _.isFunction(validate.fn) ) {
						valid = validate.fn(value, attributes)
					}
					if (!valid) {
//DEBUG &&
console.warn("invalid(%s) ", fieldId, valid, validator, validate)
						error = { id: fieldId, message: validate.message }
					}
				}
			})
			return error;
		}
	}


	return fact
});
