define(["jquery", "underscore", "backbone", "marionette", "ux"], function ($,_, Backbone, Marionette, ux) {

	var idAttribute = ux.idAttribute || "id";
	var typeAttribute = ux.typeAttribute || "widget";
	var labelAttribute = ux.labelAttribute || "label";

	ux.view.CRUD = ux.view["meta4:ux:CRUD"] = function(options) {
		options = ux.checkOptions(options, ["id", "views"]);

		var DEBUG = false // && ux.DEBUG;

        var TEMPLATE_HEADER = ux.compileTemplate("<div  class='panel-heading'><img class='pull-right' height='64' src='{{icon}}'/><h3>{{label}}</h3><p>{{comment}}</p></div>")

        var TEMPLATE_FOOTER_CREATE = ux.compileTemplate("<div class='panel-footer'><button class='btn btn-primary pull-right' data-trigger='save'>OK</button></div>")
        var TEMPLATE_FOOTER_READ = ux.compileTemplate("<div class='panel-footer'><button class='btn btn-primary' data-trigger='create'>Create</button><div/>")
        var TEMPLATE_FOOTER_UPDATE = ux.compileTemplate("<div class='panel-footer'><button class='btn btn-default' data-trigger='delete'>Delete</button><button class='btn btn-primary pull-right' data-trigger='save'>OK</button></div>")
        var TEMPLATE_FOOTER_EDIT = ux.compileTemplate("<div class='panel-footer'><button class='btn btn-primary pull-right' data-trigger='save'>OK</button></div>")

        var TEMPLATE_FORM = ux.compileTemplate("<div class='regions'><div class='region_header'></div><div class='panel-body region_body'></div><div class='region_footer'></div>")

		options.template =  options.template || TEMPLATE_FORM

		var EmptyView = Backbone.Marionette.ItemView.extend({ "template": "<!- empty ->" });

		var CRUD = Backbone.Marionette.LayoutView.extend( _.extend({
			isNested: true, isActionable: true,
            template: options.template,
            className: "panel panel-default",
            regions: { header: ".regions>.region_header" , body: ".regions>.region_body", footer: ".regions>.region_footer" },
            model: new Backbone.Model(options),
			initialize: function(_options) {
			    _.defaults(_options, { model: true, views: {} } )
                this.can = _.extend({ create: true, read: true, update: true, delete: true }, _options.can)

				ux.initialize(this, _options)
				this.initializeHeadersFooters(_options);

DEBUG && console.log("init CRUD: %o %o %o", this, _options, this.can)
                // bind CRUD events
                this.on("nested:create", this.onCreate)
				this.on("nested:childview:select", this.onSelect)
                this.on("nested:delete", this.onDelete)
				this.on("nested:finish", this.onSave)
				this.on("nested:cancel", this.onCancel)

//                var body = this._views.body || this._views.read || this._views.update
				return this;
			},
			initializeHeadersFooters: function(_options) {

               var headers = this.headers = _options.headers || {}
               var footers = this.footers = _options.footers || {}

               headers.read   =  headers.read   || { "template": TEMPLATE_HEADER }
               headers.update =  headers.update || { "template": TEMPLATE_HEADER }

               footers.create =  footers.create || { "template": TEMPLATE_FOOTER_CREATE }
               footers.read   =  footers.read   || { "template": TEMPLATE_FOOTER_READ }
               footers.update =  footers.update || { "template": TEMPLATE_FOOTER_UPDATE }
               footers.edit   =  footers.edit   || { "template": TEMPLATE_FOOTER_EDIT}

console.log("initHeadersFooters: %o %o", this.headers, this.footers)

//				ux.initialize(this, { isNested: true, views: _options.headers })
//				ux.initialize(this, { isNested: true, views: _options.footers })

			},
			onRender: function() {
                if (!this._views.body) {
                    if (this._views.read) this.triggerMethod("read")
                    else if (this._views.update) this.triggerMethod("update")
                }

			},
            onAction: function(action, meta) {
                var can = this.options.can || {}

                if (!can[action]===false) throw "meta4:ux:crud:oops:cannot-"+action;
                var _view = this.getNestedView(action, meta);

console.log("onAction (%s): %o %o", action, meta, _view)
                 if (_view) {
                    this.body.show(_view)
                }
                this.triggerMethod(action, meta.model)
            },

            onSelect: function(view, selection) {
                this.triggerMethod("update", selection)
            },

            onSave: function(model) {
                var self = this;
                model = model || self.body.currentView.model
                if (!model) return
                model.once("sync", function() {
DEBUG && console.log("onSaved: %o %o", this, arguments)
                    self.onRead()
                })

//                model.validate && model.validate()
//DEBUG &&
console.log("onSave: %o %o valid: %s", this, model, model.isValid())
                if (model.isValid())  model.save()
            },

            showHeaderFooters: function(action, options) {
                options = options || { headers: true, footers: true }
                var meta = { model: this.body.currentView.model, collection: this.collection }

                if (options.modal) {
                    this.header.show(new EmptyView(meta))
                    this.footer.show(new EmptyView(meta))
console.debug("modalHeaderFooters (%s): %o %o", options.id, this, options)
                    return;
                }
                var header = options.headers!==false && this.headers[action] || options.headers
                var footer = options.footers!==false && this.footers[action] || options.footers

console.debug("showHeaderFooters: %o %o -> %o %o / %o %o", options, meta, this.headers, header, this.footers, footer)

                header = ( header && this.getNestedView(header, meta) ) || new EmptyView(meta)
                footer = ( footer && this.getNestedView(footer, meta) ) || new EmptyView(meta)

console.debug("HeaderFooters: %o %o", header, footer)
                header && this.header.show(header)
                this.listenTo(header, "action", this.onAction )
                footer && this.footer.show(footer);
                this.listenTo(footer, "action", this.onAction )
            },

            onCreate: function() {
                var self = this
                var _collection = this.collection

                // create new model
                var _model = new _collection.model()

//                _collection.trigger("create",_model)

                // get the appropriate view
                var view = this.getNestedView("create") || this.getNestedView("update")
                if (!view) throw "meta4:ux:crud:oops:missing:view:create";

//DEBUG &&
console.log("onCreate: %o %o %o", this, _collection, view)
                view.model = _model
                this.body.show(view);

                this.showHeaderFooters("create", view.options )
                view.once("cancel", function() { self.onRead() })

view.once("save", function() {
console.log("onCreateModel: %o %o %o", _collection, view, arguments)
                _collection.add(_model)
})
view.collection.once("error", function(response) {
console.log("Create Error: %o", response)
    ux.Alert({ message: "Error: "+response.message})
    self.onRead()
})

            },
            onRead: function() {
                var can = this.options.can
                var self = this
                var meta = { collection: this.collection}
                var view = this.getNestedView("read", meta );

DEBUG && console.log("onRead: %o %o", this, view)
                if (view) {
                    this.body.show(view);
                    this.body.once("render", function() {
                        self.showHeaderFooters("read", view.options )
                    })
                } else {
                    this.destroy()
                }

            },
            onUpdate: function(selected) {

                var meta = { model: selected || this.model }
                var view = this.getNestedView("update", meta) || this.getNestedView("view", meta);
DEBUG && console.log("onUpdate: %o %o", this, selected)

                this.body.show(view);
                this.showHeaderFooters("update", view.options )

            },
            onDelete: function() {
                if (!this.can.delete) return;
                var _model = this.body.currentView.model
DEBUG && console.log("onDelete: %o %o", this, _model)
                var y_or_n = confirm("Delete?")
                if (y_or_n) {
                    _model.destroy()
                    this.onRead()
                }
                return y_or_n
            },

		}  ) )

		return CRUD;
	}

    return ux;
})
