define(["jquery", "underscore", "backbone", "marionette", "ux", "meta4/widget/Buttons"], function ($, _, Backbone, Marionette, ux, ButtonsWidget) {

	var idAttribute = ux.idAttribute || "id";
	var typeAttribute = ux.typeAttribute || "widget";
	var labelAttribute = ux.labelAttribute || "label";

	var CRUD = function(options, navigator) {
		options = ux.checkOptions(options, ["id", "views"]);

		var DEBUG = options.debug?true:ux.DEBUG?true:false;

        var TEMPLATE_TITLES = options.comment?"<h3>{{label}}</h3><p>{{comment}}</p>":"";
        var TEMPLATE_HEADER = ux.compileTemplate("<div class='panel-heading'><img class='pull-right' height='64' src='{{icon}}'/>"+TEMPLATE_TITLES+"</div>");

        // var TEMPLATE_FOOTER_CREATE = ux.compileTemplate("<div class='form-group col-sm-12 clearfix'><button class='btn btn-primary pull-right' data-action='save'>OK</button><button class='btn btn-default pull-right' data-action='cancel'>Cancel</button></div>");
        // var TEMPLATE_FOOTER_READ = ux.compileTemplate("<div class='form-group col-sm-12 clearfix'><button class='btn btn-primary pull-right' data-action='create'>Create</button><div/>");
        // var TEMPLATE_FOOTER_UPDATE = ux.compileTemplate("<div class='form-group col-sm-12 clearfix'><button class='btn btn-danger pull-left' data-action='delete'>Delete</button><button class='btn btn-primary pull-right' data-action='save'>OK</button><button class='btn btn-default pull-right' data-action='cancel'>Cancel</button></div>");
        // var TEMPLATE_FOOTER_EDIT = ux.compileTemplate("<div class='form-group col-sm-12 clearfix'>button class='btn btn-primary pull-right' data-action='save'>OK</button><button class='btn btn-default pull-right' data-action='cancel'>Cancel</button></div>");

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
			isNested: true, isActionable: false, isHoverPanel: false,
            template: options.template,
            className: "meta4_crud",
            regions: { header: ".regions>.region_header" , body: ".regions>.region_body", footer: ".regions>.region_footer" },
            model: new Backbone.Model(options),

			initialize: function(_options) {
				// sanitize options
			    _.defaults(_options, { model: false, views: {} } );
                this.can = _.extend({ create: true, read: true, update: true, delete: true }, _options.can);
                options.buttons = options.buttons || "buttons";

				ux.initialize(this, _options);
				this.initializeHeadersFooters(_options);

DEBUG && console.log("init %s CRUD: %o %o %o", this.id, this, _options, this.can);

                // bind CRUD events
                this.on("nested:create", this.onCreate);
                this.on("nested:action", this.onNestedAction);
				this.on("nested:select", this.onSelect);
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

            getButtons: function(buttons_id) {
                if (!buttons_id) throw "meta4:ux:crud:oops:missing-buttons-id";
                var modelButtons = this.navigator.models.get(this.options.buttons);
                if (!modelButtons) throw "meta4:ux:crud:oops:missing-buttons-model";
                var viewButtons = modelButtons.get(buttons_id);
                if (!viewButtons) return false;
                var buttons = viewButtons.get("buttons");
                if (!buttons) throw "meta4:ux:crud:oops:missing-button-set#"+buttons_id;
                return buttons;
            },

			initializeHeadersFooters: function(_options) {

               var headers = this.headers = _options.headers || {};
               var footers = this.footers = _options.footers || {};

               headers.read   =  headers.read   || { "template": TEMPLATE_HEADER };
               headers.update =  headers.update || { "template": TEMPLATE_HEADER };

               if (this.can.create) {
//                   footers.create =  footers.create || { "template": TEMPLATE_FOOTER_CREATE };
//                   footers.read   =  footers.read   || { "template": TEMPLATE_FOOTER_READ };
               }
               // footers.update =  footers.update || { "template": TEMPLATE_FOOTER_UPDATE };
               // footers.edit   =  footers.edit   || { "template": TEMPLATE_FOOTER_EDIT};

//DEBUG &&
console.log("init %s HeadersFooters: %o -> %o %o", this.id, this, this.headers, this.footers);

//				ux.initialize(this, { isNested: true, views: _options.headers })
//				ux.initialize(this, { isNested: true, views: _options.footers })

			},

            onInvalid: function() {
                console.error("CRUD: invalid: %o -> %o", this, arguments);
                this.$el.addClass("danger");
            },

			onRender: function() {
                if (this._views && !this._views.body) {
                    if (this._views.read) this.triggerMethod("read");
                    else if (this._views.update) this.triggerMethod("update");
                    else if (this._views.edit) this.triggerMethod("update");
                }
			},

            onNestedAction: function(action, meta) {
                console.log("CRUD %s onNestedAction (%s): %o", this.id, action, meta)
                if (this.can[action]===false) {
                    console.log("CRUD %s @ %s denied: %o -> %o", action, this.id, this, meta);
                    throw new Error("meta4:ux:crud:oops:cannot-"+action);
                }
                this.triggerMethod("action", action, meta);
                this.triggerMethod("nested:"+action, meta);
            },

            onAction: function(action, meta) {
                console.log("CRUD onAction (%s): %o -> %o", action, this, meta)
                var can = this.can || this.options.can || {};
                if (can[action]===false) {
                    console.log("CRUD %s denied: %o -> %o", action, this, meta);
                    throw new Error("meta4:ux:crud:oops:cannot-"+action);
                }
                this.triggerMethod(action, meta);
            },

            onHeaderFooterAction: function(action, meta) {
                console.log("CRUD onHeaderFooterAction (%s): %o", action, meta)
                var can = this.can || this.options.can || {};
                if (can[action]===false) {
                    console.log("CRUD %s denied: %o -> %o", action, this, meta);
                    throw new Error("meta4:ux:crud:oops:cannot-"+action);
                }
//                this.triggerMethod(action, meta);
            },

            onSelect: function(meta) {
                if (this.isSelectable===false) return;
                this.selected = meta;
                this.triggerMethod("update", meta);
            },

            onSave: function() {
                var self = this;
                var form = self.body.currentView;
                model = this.selected || this.model; // form.model;
                if (!model) {
                    console.log("CRUD %s not-selected: %o", this.id, this);
                    throw "Missing model for view: "+self.id;
                }

                model.once("sync", function() {
//DEBUG &&
console.log("CRUD %s onSaved: %o %o", this.id, this, arguments);
                    self.onRead();
                });

                model.once("error", function() {
                    console.log("CRUD %s onError: %o %o", this.id, this, arguments);
                })

                if (form.validate) {
                    var validated = form.validate();
                    console.log("CRUD %s Form validated: %o -> %o", this.id, form, validated);
                } else if (model.validate) {
                    var validated = model.validate();
                    console.log("CRUD %s Model validated: %o -> %o", this.id, form, validated);
                }

                if (model.isValid())  {
                    self.triggerMethod("valid");
                    if (model.url) {
                        // DEBUG &&
                        console.log("CRUD %s saving: %o -> %o", this.id, model, _.keys(model));
                        model.save && model.save();
                    } else {
                        DEBUG && console.log("CRUD %s not saving: %o", this.id, model);
                    }
                    if (!this.isModal) {
                        self.onRead();
                    }
                } else {
                    // DEBUG &&
                    console.warn("Can't Save CRUD: %o %o ", this, model);
                    self.triggerMethod("invalid");

                }
            },

            showHeaderFooters: function(action, meta) {
                meta = _.extend({ model: this.selected || (this.body.currentView?this.body.currentView.model:this.model),
                    collection: this.collection, can: this.can }, meta);

                if (this.isModal) {
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
                // DEBUG && console.debug("showHeader: (%s) %o %o", action, header, headerView);
                this.listenToNestedEvents(headerView, { "nested:action": true });

                var footerButtons = this.getButtons("crud:"+action);
                if (footerButtons) {
                    // Footers
                    var footer = this.options.footers!==false && this.footers[action] || this.options.footers;
                    footer = _.extend({ id: this.id+"#footer", widget: "Buttons"}, meta, { collection: footerButtons}, footer);

                    var footerView = ( footer && this.getNestedView(footer) ) || new EmptyView();
                    //DEBUG &&
                    console.debug("show %s footer: (%s) %o %o", this.id, action, footer, footerView);
                    this.footer.show(footerView);
                    this.listenToNestedEvents(footerView, { "nested:action": true });

                } else {
                    //DEBUG &&
                    console.debug("noFooter: %s (%s) %o", this.id, action, this);
//                    this.footer.show( new EmptyView() );
                }

                //console.log("showHeaderFooters: %o -> %o %o", this, header, footer);

            },

            newModel: function() {
                var _collection = this.collection;
                // create new model - attach schema
                var _model = new _collection.model();
                _model.schema = _collection.schema;
                _model.collection = _collection;
                return _model;
            },

            showBody: function(view_id, meta) {
                if (!view_id) throw "meta4:ux:crud:oops:missing:view-id";
                if (this.can[view_id] === false) {
                    console.error("Can't show %s view: %o", view_id, this);
                    return false;
                }
                var self = this;
                meta = meta || { model: this.selected?this.selected:this.model, collection: this.collection };
                var view = this.getNestedView(view_id, meta );
                if (!view) {
                    return false;
                }
                this.listenToNestedEvents(view, { "nested:action": true, "nested:footer": true });

                view.on("show", function() {
                    console.log("NESTED:FOOTER: %s -> %o -> %o", view.footer?true:false, this, view);
                    if (view.footer) {
                        self.showHeaderFooters("nested", meta);
                    }
                })

                if (view.isModal)  {
                    console.log("CRUD: modal: %s -> %o", view_id, view);
                    this.navigator.Modal(view);
                } else {
                    console.log("CRUD: body: %s -> %o", view_id, view);
                    this.body.show(view);
                    this.showHeaderFooters(view_id, meta);
                }
                return view;
            },

            onCreate: function() {
                var self = this;
                var _model = this.selected = this.newModel();
                var meta = { model: _model };

                var view = this.showBody("create", meta) || this.showBody("edit", meta);
                if (!view) throw "meta4:ux:crud:oops:missing:view:create";

DEBUG && console.error("CRUD %s onCreate: %o %o %o", this.id, this, self.collection, meta)

                view.once("cancel", function() { self.onRead() });

                this.once("save", function() {
                    console.log("CRUD onSave: %o %o %o", self.collection, view, arguments);
                    self.collection.add(_model);
                })

                view.collection.once("error", function(response) {
                    console.log("Create Error: %o", response);
                    ux.Alert({ message: "Error: "+response.message});
                    self.onRead();
                });
            },

            onRead: function(view_id) {
                view_id = view_id || "read";
                var can = this.options.can;
                var self = this
                var meta = { model: this.model, collection: this.collection };
                var view = this.showBody(view_id, meta );
                DEBUG && console.log("CRUD onRead: (%s) %o -> %o", view_id, this, view);
                if (!view) throw "meta4:ux:crud:oops:missing:view:read";

                view.on("cancel", function() {
                    this.destroy();
                })
            },

            onUpdate: function(selected) {
                var self = this;
                var meta = { model: selected || this.selected };
                var view = this.showBody("update", meta) || this.showBody("edit", meta);
                if (!view) throw "meta4:ux:crud:oops:missing:view:update-or-edit";
                DEBUG && console.log("CRUD onUpdate: %o %o", this, selected)

                this.once("cancel", function() { self.onRead() });
            },

            onDelete: function() {
                if (!this.can.delete) return;
                var _model = this.body.currentView.model;
DEBUG && console.log("CRUD onDelete: %o %o", this, _model);
                var y_or_n = confirm("Delete ?");
                if (y_or_n) {
                    _model.destroy();
                    this.onRead();
                }
                return y_or_n;
            },

            onCancel: function() {
                this.onRead();
            }

		} ) )

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
