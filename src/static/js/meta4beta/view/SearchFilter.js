define(["jquery", "underscore", "backbone", "marionette", "fact", "ux",
    "jquery_ui", "visualsearch"
], function ($,_, Backbone, Marionette, fact, ux) {

    var idAttribute = ux.idAttribute || "id";
    var typeAttribute = ux.typeAttribute || "widget";
    var labelAttribute = ux.labelAttribute || "label";
    var commentAttribute = ux.commentAttribute || "comment"

	ux.view.SearchFilter = ux.view["meta4:ux:SearchFilter"] = function(options) {

    	var DEBUG = options.debug || ux.DEBUG

		// create ItemView
		var SearchFilter = Backbone.Marionette.ItemView.extend({
			initialize: function(_options) {
				ux.initialize(this, options);
				this.model = new Backbone.Model();
console.log("SearchFilter:", this, _options)
				this.collection = this.collection?fact.filter(this.collection):this.collection
			},
			render: function() {
DEBUG && console.log("onRender: ", this)
				this.buildFacets();
				this.renderSearchFilter();
				this.showEmpty()
			},
			buildFacets: function() {
			    var self = this;
			    this.facetMatches = []
                this.valuesByFacet = {}
				if (!self.collection) return;

			    _.each(self.options.facets, function(facet) {
			        if (_.isString(facet)) self.facetMatches.push({label: facet})
			        else if (facet.facet) self.facetMatches.push({label: facet.facet })

                    var _facet = facet.facet?facet.facet:facet
                    self.valuesByFacet[_facet] = {}

					// build facets
                    self.collection.each(function(model){
                        var value = model.get(_facet)
                        if (!_.isUndefined(value)) {
                            if (facet.collection) {
                                var collection = ux.fact.models.get(facet.collection)
                                var model = collection.get(value)
DEBUG && console.log("Facet Lookup: %o %o", facet.collection, model)
                                var label = facet.template?_.template(facet.template, model.attributes):model.get(labelAttribute)
                                self.valuesByFacet[_facet][value] = { value: value, label: label }
DEBUG && console.log("Lookup Label: %s -> %o", value, label)
                            } else {
                                self.valuesByFacet[_facet][value] = { value: value, label: value }
DEBUG && console.log("Facet: %o -> %o %o", _facet, model, self.valuesByFacet[_facet])
                            }
                        }
                    })

			    })
			},
			renderSearchFilter: function() {
				var self = this
				// visual search widget
				var models = this.collection
			    VS.init({
			        container: this.$el,
			        query: '',
			        callbacks: {
			            search: function(query,searchModel) {
			            	if (!query) {
			            		self.showEmpty()
			            		return
			            	}
			            	var isClient = (models.options && models.options.isClient)
			            	if (isClient) {
				            	self.buildClientFilter(searchModel, models)
			            	} else throw "remote filter not implemented"
			            },
			            facetMatches: function(facetCallback) {
//console.log("facetMatches: %o %o", facetMatches, arguments)
			                facetCallback(self.facetMatches)
			            },
			            valueMatches: function(facet, searchTerm, callback) {
			                var values = self.valuesByFacet[facet]
DEBUG && console.log("valueMatches: %o %o -> %o", facet, searchTerm, values)
                            callback(values)
			            }
			        }
			    })
			},

			// Server-side Filter
			buildRemoteFilter: function() {
				var self = this
DEBUG && console.log("Search Remote: %o %o <- %o %o", self, models, query, searchModel)
				self.showBusy()
				var facets = []
				searchModel.each(function(facet) {
					var _facet = _.omit(facet.attributes, "app")
					facets.push( _facet)
				})
				models.fetch( {
					filter: {
						facets: facets,
					},
					success: function(model, resp, _options) {
DEBUG && console.log("Search Found: %o %o %o", model, resp, _options)
						self.showResults()
					}
				 } )
//			                self.triggerMethod("search",query,searchModel)
				return
			},
			buildClientFilter: function(query, models) {
				var self = this
				if (!models.filters) throw "not-a-filtered-collection"
DEBUG && console.log("buildClientFilter: %o %o %o", models.filters, query, models)
				models.filters.clear({silent: true})
				query.each(function(m) {
					var c = m.get("category")
					if (c=="text") {
						models.filters.set( "*" , { "$contains": m.get("value") })
					} else {
						models.filters.set(c, m.get("value"))
					}
				})
			},

			showEmpty: function() {
console.log("showEmpty")
				this.collection && this.collection.filters.clear()
			},
			showResults: function() {
console.log("showResults")
			},
			showBusy: function() {
console.log("showBusy")
			}
		})

		return SearchFilter;
	}

	// Widget meta-data allows runtime / editor to inspect basic capabilities

	return {
	    "id": "SearchFilter",
        "label": "Search Filter",
        "comment": "A widget that allows searching & filtering of a collection",
        "emits": [],
        "mixins": [],
        "views": false,
        "collection": true,
        "options": true,
        "schema": false,

        "fn": ux.view.SearchFilter
    }

})
