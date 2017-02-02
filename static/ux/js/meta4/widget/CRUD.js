define(["jquery", "underscore", "backbone", "marionette", "ux"], function ($, _, Backbone, Marionette, ux) {

	var idAttribute = ux.idAttribute || "id";
	var typeAttribute = ux.typeAttribute || "widget";
	var labelAttribute = ux.labelAttribute || "label";

	var CRUD = function(options) {
		options = ux.checkOptions(options, ["id", "views"]);

		var DEBUG = options.debug?true:ux.DEBUG?true:false;

        var TEMPLATE_TITLES = options.comment?"<h3>{{label}}</h3><p>{{comment}}</p>":"";
        var TEMPLATE_HEADER = ux.compileTemplate("<div class='panel-heading'><img class='pull-right' height='64' src='{{icon}}'/>"+TEMPLATE_TITLES+"</div>");

        var TEMPLATE_FOOTER_CREATE = ux.compileTemplate("<div class='form-group col-sm-12 clearfix'><button class='btn btn-primary pull-right' data-action='save'>OK</button><button class='btn btn-default pull-right' data-action='cancel'>Cancel</button></div>");
        var TEMPLATE_FOOTER_READ = ux.compileTemplate("<div class='form-group col-sm-12 clearfix'><button class='btn btn-primary pull-right' data-action='create'>Create</button><div/>");
        var TEMPLATE_FOOTER_UPDATE = ux.compileTemplate("<div class='form-group col-sm-12 clearfix'><button class='btn btn-danger pull-left' data-action='delete'>Delete</button><button class='btn btn-primary pull-right' data-action='save'>OK</button><button class='btn btn-default pull-right' data-action='cancel'>Cancel</button></div>");
        var TEMPLATE_FOOTER_EDIT = ux.compileTemplate("<div class='form-group col-sm-12 clearfix'>button class='btn btn-primary pull-right' data-action='save'>OK</button><button class='btn btn-default pull-right' data-action='cancel'>Cancel</button></div>");

        var TEMPLATE_FORM = ux.compileTemplate("<div class='regions'><div class='region_header'></div><div class='panel-body region_body'></div><div class='region_footer'></div></div>");

		options.template =  options.template || TEMPLATE_FORM;

		var EmptyView = Backbone.Marionette.ItemView.extend({ "template": "<!- empty ->" });

        var ActionView = Backbone.Marionette.ItemView.extend({ "template": "<!- empty ->", "css": 'clearfix',
            isActionable: true,
            initialize: function(_options) {
                console.log("init CRUD ActionView: %o %o %o", this, _options);
                ux.initialize(this, _options);
            }
        });

		var CRUDView = Backbone.Marionette.LayoutView.extend( _.extend({
			isNested: true, isActionable: true, isHoverPanel: false,
            template: options.template,
            className: "panel panel-default",
            regions: { header: ".regions>.region_header" , body: ".regions>.region_body", footer: ".regions>.region_footer" },
            model: new Backbone.Model(options),

			initialize: function(_options) {
				// sanitize options
			    _.defaults(_options, { model: true, views: {} } );
                this.can = _.extend({ create: true, read: true, update: true, delete: true }, _options.can);

				// initialize
				ux.initialize(this, _options);
				this.initializeHeadersFooters(_options);

DEBUG && console.log("init CRUD: %o %o %o", this, _options, this.can);

                // bind CRUD events
                this.on("nested:create", this.onCreate);
				this.on("nested:childview:select", this.onSelect);
                this.on("nested:delete", this.onDelete);
				this.on("nested:finish", this.onSave);
                this.on("nested:save", this.onSave);
				this.on("nested:cancel", this.onCancel);
                this.on("nested:invalid", function(){
                    alert("nested:invalid");
                });

//                var body = this._views.body || this._views.read || this._views.update
				return this;
			},

			initializeHeadersFooters: function(_options) {

               var headers = this.headers = _options.headers || {};
               var footers = this.footers = _options.footers || {};

               headers.read   =  headers.read   || { "template": TEMPLATE_HEADER };
               headers.update =  headers.update || { "template": TEMPLATE_HEADER };

               if (this.can.create) {
                   footers.create =  footers.create || { "template": TEMPLATE_FOOTER_CREATE };
                   footers.read   =  footers.read   || { "template": TEMPLATE_FOOTER_READ };
               }
               footers.update =  footers.update || { "template": TEMPLATE_FOOTER_UPDATE };
               footers.edit   =  footers.edit   || { "template": TEMPLATE_FOOTER_EDIT};

//DEBUG &&
console.log("initHeadersFooters: %o -> %o %o", this, this.headers, this.footers);

//				ux.initialize(this, { isNested: true, views: _options.headers })
//				ux.initialize(this, { isNested: true, views: _options.footers })

			},

            onInvalid: function() {
                console.error("CRUD: invalid: %o -> %o", this, arguments);
                this.$el.addClass("danger");
            },

			onRender: function() {
                if (!this._views.body) {
                    if (this._views.read) this.triggerMethod("read");
                    else if (this._views.update) this.triggerMethod("update");
                }
			},

            onAction: function(action, meta) {
                DEBUG && console.log("CRUD onAction (%s): %o", action, meta)
                var can = this.can || this.options.can || {}
                if (!can[action]===false) throw new Error("meta4:ux:crud:oops:cannot-"+action);
                this.triggerMethod(action, meta);
            },

            onSelect: function(view, selection) {
                this.triggerMethod("update", selection);
            },

            onSave: function(meta) {
                var self = this;
                model = meta.model || self.body.currentView.model;
                if (!model) throw "Missing model for view: "+self.id;
                console.log("CRUD onSave: %o %o", this, model);

                model.once("sync", function() {
//DEBUG &&
console.log("CRUD onSaved: %o %o", this, arguments);
                    self.onRead();
                });

                model.once("error", function() {
                    console.log("CRUD onError: %o %o", this, arguments);
                })

                model.on("all", function() {
                    DEBUG && console.log("CRUD ALL: %o -> %o", this, arguments)
                });

                model.validate && model.validate();
                if (model.isValid())  {
                    self.triggerMethod("valid");
                    DEBUG && console.log("CRUD onSave: %o %o valid: %s", this, model, model.isValid())
                    model.save();
                    if (!this.modal) {
                        self.onRead();
                    }
                } else {
                    // DEBUG &&
                    console.warn("Can't Save CRUD: %o %o ", this, model);
                    self.triggerMethod("invalid");

                }
            },

            showHeaderFooters: function(action, meta) {
                meta = meta || { model: this.body.currentView?this.body.currentView.model:this.model, collection: this.collection }

                if (this.options.modal) {
                    this.header.show(new ActionView(meta));
                    this.footer.show(new ActionView(meta));
DEBUG && console.debug("modalHeaderFooters (%s): %o %o", options.id, this, options)
                    return;
                }

                // Headers
                var header = this.options.headers!==false && this.headers[action] || this.options.headers;
                header = _.extend({}, meta, header);
                header.id = header.id || this.id+"#header";
                var headerView = ( header && this.getNestedView(header, meta) ) || new ActionView(header);
                DEBUG && console.debug("showHeader: (%s) %o %o", action, header, headerView);
                this.listenTo(headerView, "action", this.onAction );

                // Footers
                var footer = this.options.footers!==false && this.footers[action] || this.options.footers;
                footer = _.extend({}, meta, footer);
                footer.id = footer.id || this.id+"#footer";
                var footerView = ( footer && this.getNestedView(footer, meta) ) || new ActionView(footer);
                DEBUG && console.debug("showFooter: (%s) %o %o", action, footer, footerView);
                this.footer.show(footerView);
                this.listenTo(footerView, "action", this.onAction );

            },

            onCreate: function() {
                var self = this;

                var _collection = this.collection;

                // create new model - attach schema
                var _model = new _collection.model();
                _model.schema = _collection.schema;
	            _model.collection = _collection;

	            var meta = { model: _model };

DEBUG && console.log("CRUD onCreate: %o %o %o", this, _collection, meta)

//                _collection.trigger("create",_model)

                // heuristically acquire an editable view
                var view = this.getNestedView("create", meta) || this.getNestedView("edit", meta);
                if (!view) throw "meta4:ux:crud:oops:missing:view:create";

                this.once("cancel", function() { self.onRead() });

                this.once("save", function() {
                    console.log("CRUD onSave: %o %o %o", _collection, view, arguments);
                    _collection.add(_model);
                })

                view.collection.once("error", function(response) {
                    console.log("Create Error: %o", response);
                    ux.Alert({ message: "Error: "+response.message});
                    self.onRead();
                });

                this.body.show(view);
                this.showHeaderFooters("create", { model: _model, collection: _collection} )
            },

            onRead: function() {
                var can = this.options.can
                var self = this
                var meta = { model: this.model, collection: this.collection };
                var view = this.getNestedView("read", meta );

DEBUG && console.log("CRUD onRead: %s -> %o", this, view);
                if (view) {
                    this.showHeaderFooters("read", meta )
                    this.body.show(view);
                } else {
                    this.destroy();
                }
            },

            onUpdate: function(selected) {
                var self = this;
                var meta = { model: selected || this.model };
                var view = this.getNestedView("update", meta) || this.getNestedView("edit", meta) || this.getNestedView("view", meta);
DEBUG && console.log("CRUD onUpdate: %o %o", this, selected)

                this.once("cancel", function() { self.onRead() });
                this.body.show(view);
                this.showHeaderFooters("update", meta );
            },

            onDelete: function() {
                if (!this.can.delete) return;
                var _model = this.body.currentView.model;
DEBUG && console.log("CRUD onDelete: %o %o", this, _model);
                var y_or_n = confirm("Delete?");
                if (y_or_n) {
                    _model.destroy();
                    this.onRead();
                }
                return y_or_n;
            }

		}  ) )

		return CRUDView;
	}

	// Widget meta-data allows runtime / editor to inspect basic capabilities

	return {
	    "id": "CRUD",
        "label": "CRUD",
        "comment": "Manage collections with create, read, update & delete",
        "triggers": [ "create", "read", "update", "delete", "save", "invalid", "transition", "select", "action" ],
        "can": [ "create", "read", "update", "delete" ],
        "mixins": [ "isNested", "isActionable", "isHoverPanel" ],
        "views": [ "create", "read", "update", "delete" ],
        "collection": true,
        "options": true,

        "fn": CRUD
    }


})
