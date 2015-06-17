define(["jquery", "underscore", "backbone"], function ($,_,Backbone) {

	/* *****************************************************************************************************************
		Prototype Inheritance
	**************************************************************************************************************** */

	$.curCSS = $.css; // back-port jquery 1.8+


	/* *****************************************************************************************************************

	**************************************************************************************************************** */

	return {
		DEBUG: false,
		idAttribute: "id", labelAttribute: "label", typeAttribute: "type", commentAttribute: "comment",
		fact: {
		},

		ux: {
			i18n: {},
			types: {},
			mixin: {},
			view: { field: {} }
		},

		iq: {
		},

		NS: {
			"owl": 	"http://www.w3.org/2002/07/owl#",
			"rdf": 	"http://www.w3.org/1999/02/22-rdf-syntax-ns#",
			"rdfs": "http://www.w3.org/2000/01/rdf-schema#",
			"xsd":	"http://www.w3.org/2001/XMLSchema#",
			"ux":   "meta4:ux:",
			"iq":   "meta4:iq:",
			"fact": "meta4:fact:",
			"asq":  "meta4:asq:",
		},

		/**
			curried fn()
			when invoked returns a fn() that in turns calls a named fn() on a context object
			e.g: dispatch(source, "doSomething")(a,b,c) -> source.doSomething(a,b,c)

		**/
		dispatch: function(self, event) {
			return function() {
				return self[event] && self[event].apply(self, arguments)
			}
		},

		resolve: function(options, modelled) {
			if (!options) throw "meta4:ux:oops:missing-options"
			var _DEBUG = options.debug || this.ux.DEBUG
			modelled = modelled || _.extend({},options);

			// Resolve Backbone Model - last resort, use 'options'
			if (_.isString(options.model)) {
				modelled.model = this.fact.models.get(options.model);
//_DEBUG &&
console.warn("Model$ (%s) %o %o -> %o", options.model, this.fact.models, options, modelled);
			} else if ( options.model instanceof Backbone.Model ) {
				modelled.model = options.model;
			} else if (_.isFunction(options.model)) {
				modelled.model = options.model(options);
			} else if (_.isObject(options.model)) {
				modelled.model = new this.fact.Model( options.model );
			} else if ( options.model === false ) {
//				modelled.model = new Backbone.Model()
_DEBUG && console.debug("No Model: %o %o", options, modelled)
			} else if ( options.model === true || options.model == undefined) {
				var _options = { label: options.label, comment: (options.comment || ""), icon: (options.icon || "") };
				_options.idAttribute = options[this.ux.idAttribute]
				modelled.model = new this.fact.Model({})
				modelled.model.set(_options)
_DEBUG && console.debug("View Model (%s): %o %o", modelled.id, _options, modelled.model)
			} else throw "meta4:ux:oops:invalid-model#"+options.model

			// Resolve Backbone Collection
			if (_.isString(options.collection)) {
				// recursively re-model ... check if a sub-model first

				var _collection = false

				// nested-collection
				if (options.collection.indexOf(".")==0) {
					var cid = options.collection.substring(1)
					_collection = modelled.model.get(cid)
					if (!_collection) {
						_collection = new Backbone.Collection()
_DEBUG && console.log("New Local Collection (%s): %o %o %o", cid, options, modelled, _collection)
						modelled.model.set(cid, _collection)
					} else {
_DEBUG && console.log("Existing Local Collection (%s): %o %o %o", cid, options, modelled, _collection)
					}
				} else if (options.collection.indexOf("!")==0) {
				// global-collection
					var cid = options.collection.substring(1)
					_collection = fact.models.get(cid)
_DEBUG && console.log("Global Collection (%s): %o %o %o", cid, options, modelled, _collection)
				} else {
					var cid = options.collection
					_collection = modelled.model.get(cid) || this.fact.models.get(cid)
_DEBUG && console.log("Local/Global Collection (%s): %o %o %o", cid, options, modelled, _collection)
				}

				if (!_collection) {
					_collection = this.fact.factory.Local({ id: options.collection, fetch: false })
_DEBUG && console.log("Local Collection: %o %o %o %o", options.collection, options, modelled, _collection)
				}
				// resolve any string models
				this.ux.model( { model: modelled.model, collection: _collection }, modelled);
_DEBUG && console.log("String Modelled: %o", modelled)
			} else if (_.isArray(options.collection)) {
_DEBUG && console.log("Array Collection", options.collection, this.fact)
				modelled.collection = this.fact.Collection(options.collection);
			} else if (_.isObject(options.collection) && options.collection instanceof Backbone.Collection ) {
_DEBUG && console.log("Existing Collection: %o", options.collection)
				modelled.collection = options.collection;
			} else if (_.isObject(options.collection) && _.isString(options.collection.id) ) {
//_DEBUG &&
console.log("Register Collection: %s -> %o / %o", options.collection.id, options.collection, this.fact)
				modelled.collection = this.fact.models.get(options.collection.id) || this.fact.register(options.collection)
			} else if (_.isFunction(options.collection)) {
_DEBUG && console.log("Function Collection", options.collection, this.fact)
				modelled.collection = options.collection(options);
			}

			// cloned originally options - with resolved Model, optionally a Collection
			return modelled;

		},

		/**
			Uses a curried fn() to replace key/values in options{}
			if a matching option key exists within mix_ins{}
			if the mixin is fn() then execute & bind the returned value
		**/
		curry: function(options, mix_ins, _options) {
			if (!options || !mix_ins) return options;
			_options = _options || {} // cloned object
			_.each(options, function(option,key) {
				var mixin = mix_ins[key]
				_options[key] = _.isFunction(mixin)?mixin(option):option
			})
			return _options;
		},

		/**
			Rename/Replace the keys in an key/value Object using a re-mapping object
			@param: options - Object of key/values
			@param: remap - Object of key1/key2
		**/
		remap: function(options, remap) {
			if (!options || !remap) return options;
			var map = {}
			_.each(remap, function(v,k) {
				var n = options[k]
				if (_.isFunction(v)) map[v] = v(n, k, map)
				else if ( !_.isUndefined(n) && !_.isUndefined(v) ) map[v] = n
			})
			return map;
		},

		/**
			De-reference string-based 'values' to a mix-in fn()
			Replaces string values in options with corresponding fn() from mixin
		**/
		mixin: function(options, mix_ins, _options) {
			if (!options || !mix_ins) return options;
			_options = _options || options // default original
			_.each(options, function(value,key) {
				if (_.isString(value)) {
					var mixin = mix_ins[value]
					if (mixin && _.isFunction(mixin)) {
						options[key] = _.isFunction(mixin)?mixin:value
					}
				}
			})
			return _options;
		},


		isDefaultTrue: function(options, key) {
			if (_.isUndefined(options)) return true;
			return options[key]?true:false
		},

		/**
			Utilities to deal with Strings (including special cases for 'id' strings)
		**/

		/**
		 	Generate a reasonably unique UUID
		**/
		uuid: function() {
			function _id() { return (((1+Math.random())*0x10000)|0).toString(16).substring(1); };
			return (_id()+"-"+_id()+"-"+_id()+"-"+_id()+"-"+_id()+"-"+_id()+"-"+_id()+"-"+_id());
		},

		/**
		 	Generate a scoped UUID by pre-pending a prefix
		**/
		urn: function(prefix) {
			return (prefix || core[idAttribute])+"#"+this.uuid();
		},

		/**
		 	Turn camel-cased strings into a capitalised, space-separated string
		**/
		humanize: function(s) {
			return s.replace(/\W+|_|-/g, " ").toLowerCase().replace(/(^[a-z]| [a-z]|-[a-z])/g, function($1) { return $1.toUpperCase() });
		},

		toQueryString(obj, prefix) {
			serialize = function(obj, prefix) {
			  var str = [];
			  for(var p in obj) {
			    if (obj.hasOwnProperty(p)) {
			      var k = prefix ? prefix + "[" + p + "]" : p, v = obj[p];
			      str.push(typeof v == "object" ?
			        serialize(v, k) :
			        encodeURIComponent(k) + "=" + encodeURIComponent(v));
			    }
			  }
			  return str.join("&");
			}
			return serialize(obj, prefix)
		}

	}

});